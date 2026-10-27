import json
from datetime import date, timedelta
from decimal import Decimal
from io import BytesIO, StringIO
from unittest.mock import patch
from urllib.error import URLError
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone

from farms.models import Farm
from weather.models import WeatherForecastRun, WeatherRecord
from weather.services.forecasts import (
    forecast_freshness,
    forecast_history,
    get_forecast_horizon,
    latest_usable_forecast,
    last_successful_retrieval,
    refresh_farm_forecast,
)
from weather.services.open_meteo import (
    ForecastProviderError,
    fetch_forecast,
    parse_response,
)


VALID_RESPONSE = {
    "timezone": "Africa/Nairobi",
    "daily_units": {
        "precipitation_sum": "mm",
        "temperature_2m_min": "°C",
        "temperature_2m_max": "°C",
    },
    "daily": {
        "time": ["2026-10-27", "2026-10-28"],
        "precipitation_sum": ["2.35", "0"],
        "temperature_2m_min": ["12.1", "11"],
        "temperature_2m_max": ["24.7", "25"],
    },
}


class OpenMeteoClientTests(SimpleTestCase):
    def test_parser_normalizes_values_and_keeps_nulls(self):
        payload = parse_response(VALID_RESPONSE)

        self.assertEqual(len(payload.records), 2)
        self.assertEqual(payload.records[0].precipitation_mm, Decimal("2.35"))
        self.assertEqual(payload.records[0].temperature_min_c, Decimal("12.10"))
        self.assertEqual(payload.records[0].temperature_max_c, Decimal("24.70"))

    @patch("weather.services.open_meteo.urlopen")
    def test_request_has_expected_parameters_and_timeouts(self, mock_urlopen):
        response = BytesIO(json.dumps(VALID_RESPONSE).encode())
        response.getcode = lambda: 200
        mock_urlopen.return_value.__enter__.return_value = response

        fetch_forecast(
            Decimal("-0.303099"),
            Decimal("36.080025"),
            forecast_days=7,
            timezone="Africa/Nairobi",
            timeout=9,
        )

        request = mock_urlopen.call_args.args[0]
        timeout = mock_urlopen.call_args.kwargs["timeout"]
        parameters = parse_qs(urlparse(request.full_url).query)
        self.assertEqual(parameters["daily"], ["precipitation_sum,temperature_2m_min,temperature_2m_max"])
        self.assertEqual(parameters["forecast_days"], ["7"])
        self.assertEqual(parameters["timezone"], ["Africa/Nairobi"])
        self.assertEqual(parameters["temperature_unit"], ["celsius"])
        self.assertEqual(parameters["precipitation_unit"], ["mm"])
        self.assertEqual(parameters["latitude"], ["-0.303099"])
        self.assertEqual(timeout, 9)

    @patch("weather.services.open_meteo.urlopen", side_effect=TimeoutError())
    def test_timeout_is_reported_as_provider_error(self, _mock_urlopen):
        with self.assertRaisesRegex(ForecastProviderError, "timed out"):
            fetch_forecast(Decimal("0"), Decimal("0"))

    @patch("weather.services.open_meteo.urlopen", side_effect=URLError("offline"))
    def test_connection_failure_is_reported(self, _mock_urlopen):
        with self.assertRaisesRegex(ForecastProviderError, "Could not connect"):
            fetch_forecast(Decimal("0"), Decimal("0"))

    @patch("weather.services.open_meteo.urlopen")
    def test_http_error_is_reported(self, mock_urlopen):
        from urllib.error import HTTPError

        mock_urlopen.side_effect = HTTPError("url", 503, "unavailable", {}, None)
        with self.assertRaisesRegex(ForecastProviderError, "503"):
            fetch_forecast(Decimal("0"), Decimal("0"))

    @patch("weather.services.open_meteo.urlopen")
    def test_invalid_json_is_reported(self, mock_urlopen):
        response = BytesIO(b"not-json")
        response.getcode = lambda: 200
        mock_urlopen.return_value.__enter__.return_value = response
        with self.assertRaisesRegex(ForecastProviderError, "invalid JSON"):
            fetch_forecast(Decimal("0"), Decimal("0"))

    def test_missing_daily_dates_and_wrong_types_are_rejected(self):
        with self.assertRaises(ForecastProviderError):
            parse_response({"daily": []})
        with self.assertRaises(ForecastProviderError):
            parse_response({"daily": {"time": []}})

    def test_missing_variables_and_invalid_measurements_are_partial_unknowns(self):
        response = {
            "timezone": "Africa/Nairobi",
            "daily_units": VALID_RESPONSE["daily_units"],
            "daily": {
                "time": ["2026-10-27", "not-a-date"],
                "precipitation_sum": [None],
                "temperature_2m_min": ["wrong", 10],
                "temperature_2m_max": [20],
            },
        }
        payload = parse_response(response)

        self.assertTrue(payload.is_partial)
        self.assertEqual(len(payload.records), 1)
        self.assertIsNone(payload.records[0].precipitation_mm)
        self.assertIsNone(payload.records[0].temperature_min_c)
        self.assertEqual(payload.records[0].temperature_max_c, Decimal("20.00"))

    def test_empty_usable_payload_and_invalid_temperature_pair_are_not_successful(self):
        no_values = {
            "timezone": "Africa/Nairobi",
            "daily_units": VALID_RESPONSE["daily_units"],
            "daily": {"time": ["2026-10-27"]},
        }
        with self.assertRaises(ForecastProviderError):
            parse_response(no_values)

        invalid_pair = {
            "timezone": "Africa/Nairobi",
            "daily_units": VALID_RESPONSE["daily_units"],
            "daily": {
                "time": ["2026-10-27"],
                "precipitation_sum": [None],
                "temperature_2m_min": [30],
                "temperature_2m_max": [20],
            },
        }
        with self.assertRaises(ForecastProviderError):
            parse_response(invalid_pair)


class WeatherForecastServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()
        cls.owner = User.objects.create_user(username="weather_farmer", password="pass")
        cls.other_user = User.objects.create_user(username="another_farmer", password="pass")
        cls.farm = Farm.objects.create(
            owner=cls.owner,
            name="Weather Farm",
            location="Nakuru",
            latitude=Decimal("-0.303099"),
            longitude=Decimal("36.080025"),
        )
        cls.no_coordinates_farm = Farm.objects.create(
            owner=cls.owner,
            name="Unlocated Farm",
            location="Kenya",
        )

    @patch("weather.services.forecasts.fetch_forecast")
    def test_refresh_creates_run_and_daily_rows(self, mock_fetch):
        mock_fetch.return_value = parse_response(VALID_RESPONSE)

        result = refresh_farm_forecast(self.farm)

        self.assertEqual(result["status"], WeatherForecastRun.Status.SUCCESS)
        self.assertEqual(result["run"].records.count(), 2)
        self.assertEqual(result["run"].requested_latitude, self.farm.latitude)
        self.assertEqual(
            latest_usable_forecast(self.farm, date(2026, 10, 27)).precipitation_mm,
            Decimal("2.35"),
        )

    @patch("weather.services.forecasts.fetch_forecast")
    def test_refresh_uses_current_coordinates_and_snapshots_them(self, mock_fetch):
        mock_fetch.return_value = parse_response(VALID_RESPONSE)
        stale_instance = self.farm
        Farm.objects.filter(pk=self.farm.pk).update(
            latitude=Decimal("1.234567"),
            longitude=Decimal("2.345678"),
        )

        result = refresh_farm_forecast(stale_instance)

        self.assertEqual(result["run"].requested_latitude, Decimal("1.234567"))
        self.assertEqual(result["run"].requested_longitude, Decimal("2.345678"))
        self.assertEqual(mock_fetch.call_args.args[:2], (Decimal("1.234567"), Decimal("2.345678")))

    @patch("weather.services.forecasts.fetch_forecast")
    def test_refresh_preserves_versions_and_latest_query_selects_newest(self, mock_fetch):
        mock_fetch.return_value = parse_response(VALID_RESPONSE)
        first = refresh_farm_forecast(self.farm)["run"]
        mock_fetch.return_value = parse_response(
            {
                **VALID_RESPONSE,
                "daily": {
                    **VALID_RESPONSE["daily"],
                    "precipitation_sum": ["8", "1"],
                },
            }
        )
        second = refresh_farm_forecast(self.farm)["run"]

        self.assertNotEqual(first.pk, second.pk)
        self.assertEqual(WeatherRecord.objects.filter(forecast_run__farm=self.farm).count(), 4)
        latest = latest_usable_forecast(self.farm, date(2026, 10, 27))
        self.assertEqual(latest.forecast_run_id, second.pk)
        self.assertEqual(latest.precipitation_mm, Decimal("8.00"))
        self.assertEqual(forecast_history(self.farm, date(2026, 10, 27)).count(), 2)

    @patch("weather.services.forecasts.fetch_forecast", side_effect=ForecastProviderError("safe provider error"))
    def test_failed_attempt_is_recorded_without_hiding_old_forecast(self, _mock_fetch):
        success = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            requested_latitude=self.farm.latitude,
            requested_longitude=self.farm.longitude,
            status=WeatherForecastRun.Status.SUCCESS,
        )
        old = WeatherRecord.objects.create(
            forecast_run=success,
            forecast_date=date(2026, 10, 27),
            precipitation_mm=Decimal("4"),
        )

        result = refresh_farm_forecast(self.farm)

        self.assertEqual(result["status"], WeatherForecastRun.Status.FAILED)
        self.assertIsNotNone(result["run"].error_summary)
        self.assertEqual(latest_usable_forecast(self.farm, old.forecast_date).pk, old.pk)

    @patch("weather.services.forecasts.fetch_forecast")
    def test_partial_values_are_retained_as_null(self, mock_fetch):
        partial = parse_response(
            {
                "timezone": "Africa/Nairobi",
                "daily_units": VALID_RESPONSE["daily_units"],
                "daily": {
                    "time": ["2026-10-27"],
                    "precipitation_sum": [None],
                    "temperature_2m_min": [12],
                    "temperature_2m_max": [None],
                },
            }
        )
        mock_fetch.return_value = partial

        result = refresh_farm_forecast(self.farm)
        record = result["run"].records.get()

        self.assertEqual(result["status"], WeatherForecastRun.Status.PARTIAL)
        self.assertIsNone(record.precipitation_mm)
        self.assertIsNone(record.temperature_max_c)
        self.assertEqual(record.temperature_min_c, Decimal("12.00"))

    @patch("weather.services.forecasts.fetch_forecast", side_effect=AssertionError("must not call"))
    def test_missing_coordinates_skip_without_api_call(self, mock_fetch):
        result = refresh_farm_forecast(self.no_coordinates_farm)

        self.assertEqual(result["status"], "SKIPPED")
        mock_fetch.assert_not_called()
        self.assertFalse(WeatherForecastRun.objects.filter(farm=self.no_coordinates_farm).exists())

    def test_weather_record_uniqueness_and_validation(self):
        run = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            status=WeatherForecastRun.Status.SUCCESS,
        )
        WeatherRecord.objects.create(
            forecast_run=run,
            forecast_date=date(2026, 10, 27),
            precipitation_mm=Decimal("1"),
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                WeatherRecord.objects.create(
                    forecast_run=run,
                    forecast_date=date(2026, 10, 27),
                )

        invalid = WeatherRecord(
            forecast_run=run,
            forecast_date=date(2026, 10, 28),
            precipitation_mm=Decimal("-1"),
            temperature_min_c=Decimal("25"),
            temperature_max_c=Decimal("20"),
        )
        with self.assertRaises(ValidationError):
            invalid.full_clean()

    def test_freshness_states_and_latest_success(self):
        run = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            status=WeatherForecastRun.Status.SUCCESS,
        )
        record = WeatherRecord.objects.create(
            forecast_run=run,
            forecast_date=date(2026, 10, 27),
            precipitation_mm=Decimal("2"),
            temperature_min_c=Decimal("10"),
            temperature_max_c=Decimal("20"),
        )
        now = timezone.now()
        self.assertEqual(
            forecast_freshness(self.farm, record.forecast_date, now=run.fetched_at + timedelta(hours=1))["status"],
            "FRESH",
        )
        self.assertEqual(
            forecast_freshness(self.farm, record.forecast_date, now=run.fetched_at + timedelta(hours=25))["status"],
            "STALE",
        )
        self.assertEqual(last_successful_retrieval(self.farm).pk, run.pk)
        self.assertEqual(forecast_freshness(self.no_coordinates_farm, record.forecast_date)["status"], "MISSING_COORDINATES")
        self.assertEqual(forecast_freshness(self.farm, date(2027, 1, 1))["status"], "UNAVAILABLE")

    def test_partial_run_has_partial_freshness_state(self):
        run = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            status=WeatherForecastRun.Status.PARTIAL,
        )
        WeatherRecord.objects.create(
            forecast_run=run,
            forecast_date=date(2026, 10, 27),
            precipitation_mm=Decimal("2"),
        )

        state = forecast_freshness(self.farm, date(2026, 10, 27), now=run.fetched_at)

        self.assertEqual(state["status"], "PARTIAL")

    def test_stale_forecast_warning_renders(self):
        from weather.views import _farm_local_today

        today = _farm_local_today()
        run = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            status=WeatherForecastRun.Status.SUCCESS,
        )
        WeatherForecastRun.objects.filter(pk=run.pk).update(
            fetched_at=timezone.now() - timedelta(hours=25)
        )
        WeatherRecord.objects.create(
            forecast_run=run,
            forecast_date=today,
            precipitation_mm=Decimal("1"),
            temperature_min_c=Decimal("10"),
            temperature_max_c=Decimal("20"),
        )
        self.client.force_login(self.owner)

        response = self.client.get(reverse("weather:farm_forecast", args=[self.farm.pk]))

        self.assertContains(response, "This forecast is stale")

    def test_forecast_page_renders_measurement_values_not_template_tokens(self):
        from weather.views import _farm_local_today

        today = _farm_local_today()
        run = WeatherForecastRun.objects.create(
            farm=self.farm,
            source=WeatherForecastRun.Source.OPEN_METEO,
            status=WeatherForecastRun.Status.SUCCESS,
        )
        WeatherRecord.objects.create(
            forecast_run=run,
            forecast_date=today,
            precipitation_mm=Decimal("2.40"),
            temperature_min_c=Decimal("13.20"),
            temperature_max_c=Decimal("24.80"),
        )
        self.client.force_login(self.owner)

        response = self.client.get(reverse("weather:farm_forecast", args=[self.farm.pk]))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "2.40 mm")
        self.assertContains(response, "13.20 °C")
        self.assertContains(response, "24.80 °C")
        self.assertNotContains(response, "{{ record.")

    def test_horizon_returns_latest_version_by_date_in_order(self):
        for forecast_day, amount in (
            (date(2026, 10, 27), Decimal("2")),
            (date(2026, 10, 28), Decimal("3")),
        ):
            run = WeatherForecastRun.objects.create(
                farm=self.farm,
                source=WeatherForecastRun.Source.OPEN_METEO,
                status=WeatherForecastRun.Status.SUCCESS,
            )
            WeatherRecord.objects.create(
                forecast_run=run,
                forecast_date=forecast_day,
                precipitation_mm=amount,
            )
        records = get_forecast_horizon(self.farm, date(2026, 10, 27), days=2)
        self.assertEqual([row.forecast_date for row in records], [date(2026, 10, 27), date(2026, 10, 28)])

    def test_farm_forecast_page_is_owner_scoped(self):
        self.client.force_login(self.owner)
        response = self.client.get(
            reverse("weather:farm_forecast", args=[self.no_coordinates_farm.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "weather/farm_forecast.html")
        self.assertContains(response, "add both latitude and longitude")
        self.assertContains(response, "Open-Meteo")

        self.client.force_login(self.other_user)
        denied = self.client.get(reverse("weather:farm_forecast", args=[self.farm.pk]))
        self.assertEqual(denied.status_code, 404)

    def test_command_targeting_and_missing_coordinate_summary(self):
        from django.core.management import call_command

        output = StringIO()
        call_command("refresh_weather", farm_id=self.no_coordinates_farm.pk, stdout=output)
        self.assertIn("skipped=1", output.getvalue())

        from django.core.management import CommandError

        with self.assertRaises(CommandError):
            call_command("refresh_weather", farm_id=999999, stdout=StringIO())

    @patch("weather.management.commands.refresh_weather.refresh_farm_forecast")
    def test_command_continues_after_one_farm_failure(self, mock_refresh):
        Farm.objects.create(
            owner=self.owner,
            name="Third Farm",
            location="Rift Valley",
            latitude=Decimal("1.000000"),
            longitude=Decimal("2.000000"),
        )
        mock_refresh.side_effect = [
            RuntimeError("failure"),
            {"status": "SKIPPED", "run": None},
            {"status": "SUCCESS", "run": None},
        ]
        output = StringIO()

        from django.core.management import call_command

        with self.assertLogs("weather.management.commands.refresh_weather", level="ERROR"):
            call_command("refresh_weather", stdout=output, stderr=StringIO())
        self.assertIn("success=1, partial=0, failed=1, skipped=1", output.getvalue())


class FarmCoordinateValidationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(username="coordinate_farmer")

    def make_farm(self, **coordinates):
        return Farm(
            owner=self.user,
            name="Coordinate Farm",
            location="Kenya",
            **coordinates,
        )

    def test_missing_coordinate_pair_remains_valid(self):
        self.make_farm().full_clean()

    def test_valid_coordinate_pair(self):
        self.make_farm(
            latitude=Decimal("-90.000000"),
            longitude=Decimal("180.000000"),
        ).full_clean()

    def test_out_of_range_and_incomplete_coordinates_fail_validation(self):
        for farm in (
            self.make_farm(latitude=Decimal("90.000001"), longitude=Decimal("0")),
            self.make_farm(latitude=Decimal("0"), longitude=Decimal("180.000001")),
            self.make_farm(latitude=Decimal("0")),
        ):
            with self.subTest(latitude=farm.latitude, longitude=farm.longitude):
                with self.assertRaises(ValidationError):
                    farm.full_clean()
