"""Persistence, version selection, and freshness policies for forecasts."""

import logging
from datetime import date, timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.utils import timezone

from farms.models import Farm
from weather.models import WeatherForecastRun, WeatherRecord
from weather.services.open_meteo import ForecastProviderError, fetch_forecast

logger = logging.getLogger(__name__)
FRESHNESS_HOURS = 24
DEFAULT_FORECAST_DAYS = 7
DEFAULT_PROVIDER_TIMEZONE = "Africa/Nairobi"


def _forecast_settings():
    horizon = int(getattr(settings, "WEATHER_FORECAST_DAYS", DEFAULT_FORECAST_DAYS))
    if not 1 <= horizon <= 16:
        horizon = DEFAULT_FORECAST_DAYS
    provider_timezone = getattr(
        settings,
        "WEATHER_PROVIDER_TIMEZONE",
        DEFAULT_PROVIDER_TIMEZONE,
    )
    timeout = float(getattr(settings, "WEATHER_HTTP_TIMEOUT_SECONDS", 15))
    return horizon, provider_timezone, timeout


def refresh_farm_forecast(farm):
    """Record one provider attempt and preserve all previous forecast versions."""
    farm = Farm.objects.get(pk=farm.pk)
    if farm.latitude is None or farm.longitude is None:
        return {"status": "SKIPPED", "reason": "MISSING_COORDINATES", "run": None}

    horizon, provider_timezone, timeout = _forecast_settings()
    run = WeatherForecastRun.objects.create(
        farm=farm,
        source=WeatherForecastRun.Source.OPEN_METEO,
        requested_latitude=farm.latitude,
        requested_longitude=farm.longitude,
        status=WeatherForecastRun.Status.FAILED,
    )
    try:
        payload = fetch_forecast(
            farm.latitude,
            farm.longitude,
            forecast_days=horizon,
            timezone=provider_timezone,
            timeout=timeout,
        )
    except ForecastProviderError as error:
        run.error_summary = str(error)[:255]
        run.save(update_fields=["error_summary"])
        logger.warning("Weather refresh failed for farm_id=%s: %s", farm.pk, run.error_summary)
        return {"status": "FAILED", "reason": "PROVIDER_ERROR", "run": run}
    except Exception:
        run.error_summary = "Unexpected error while retrieving weather forecast."
        run.save(update_fields=["error_summary"])
        logger.exception("Unexpected weather provider error for farm_id=%s", farm.pk)
        return {"status": "FAILED", "reason": "PROVIDER_ERROR", "run": run}

    partial = payload.is_partial
    try:
        with transaction.atomic():
            run.provider_timezone = payload.provider_timezone
            for daily in payload.records:
                record = WeatherRecord(
                    forecast_run=run,
                    forecast_date=daily.forecast_date,
                    precipitation_mm=daily.precipitation_mm,
                    temperature_min_c=daily.temperature_min_c,
                    temperature_max_c=daily.temperature_max_c,
                )
                try:
                    record.full_clean()
                    record.save()
                except ValidationError:
                    partial = True
                    logger.warning(
                        "Skipping invalid weather record farm_id=%s forecast_date=%s",
                        farm.pk,
                        daily.forecast_date,
                    )
            if not run.records.filter(models_q_usable_records()).exists():
                raise ForecastProviderError("Provider returned no usable daily forecast data.")
            run.status = (
                WeatherForecastRun.Status.PARTIAL
                if partial
                else WeatherForecastRun.Status.SUCCESS
            )
            run.error_summary = (
                "Some forecast values were missing or invalid."
                if partial
                else None
            )
            run.save(update_fields=["provider_timezone", "status", "error_summary"])
    except ForecastProviderError as error:
        run.status = WeatherForecastRun.Status.FAILED
        run.error_summary = str(error)[:255]
        run.save(update_fields=["status", "error_summary"])
        logger.warning("Weather refresh had no usable records farm_id=%s", farm.pk)
        return {"status": "FAILED", "reason": "NO_USABLE_DATA", "run": run}
    except DatabaseError:
        run.status = WeatherForecastRun.Status.FAILED
        run.error_summary = "Forecast data could not be saved."
        run.save(update_fields=["status", "error_summary"])
        logger.exception("Weather persistence failed for farm_id=%s", farm.pk)
        return {"status": "FAILED", "reason": "PERSISTENCE_ERROR", "run": run}
    except Exception:
        run.status = WeatherForecastRun.Status.FAILED
        run.error_summary = "Unexpected error while saving forecast data."
        run.save(update_fields=["status", "error_summary"])
        logger.exception("Unexpected weather persistence error for farm_id=%s", farm.pk)
        return {"status": "FAILED", "reason": "PERSISTENCE_ERROR", "run": run}

    return {"status": run.status, "reason": None, "run": run}


def models_q_usable_records():
    return (
        Q(precipitation_mm__isnull=False)
        | Q(temperature_min_c__isnull=False)
        | Q(temperature_max_c__isnull=False)
    )


def _usable_records(farm, forecast_date=None):
    queryset = WeatherRecord.objects.filter(
        forecast_run__farm=farm,
        forecast_run__status__in=[
            WeatherForecastRun.Status.SUCCESS,
            WeatherForecastRun.Status.PARTIAL,
        ],
    ).filter(models_q_usable_records())
    if forecast_date is not None:
        queryset = queryset.filter(forecast_date=forecast_date)
    return queryset.order_by("-forecast_run__fetched_at", "-forecast_run_id", "-pk")


def latest_usable_forecast(farm, forecast_date: date):
    """Return the newest usable record for one farm/day, deterministically."""
    return _usable_records(farm, forecast_date).select_related("forecast_run").first()


def get_forecast_horizon(farm, start_date: date | None = None, days: int | None = None):
    """Return at most one newest version per day, in date order."""
    if start_date is None:
        start_date = timezone.localdate()
    if days is None:
        days = _forecast_settings()[0]
    end_date = start_date + timedelta(days=days - 1)
    versions = _usable_records(farm).filter(
        forecast_date__range=(start_date, end_date)
    ).select_related("forecast_run")
    newest_by_date = {}
    for record in versions:
        newest_by_date.setdefault(record.forecast_date, record)
    return [newest_by_date[day] for day in sorted(newest_by_date)]


def last_successful_retrieval(farm):
    """Return the latest successful or partial run containing usable data."""
    return (
        WeatherForecastRun.objects.filter(
            farm=farm,
            status__in=[
                WeatherForecastRun.Status.SUCCESS,
                WeatherForecastRun.Status.PARTIAL,
            ],
        )
        .filter(
            Q(records__precipitation_mm__isnull=False)
            | Q(records__temperature_min_c__isnull=False)
            | Q(records__temperature_max_c__isnull=False)
        )
        .order_by("-fetched_at", "-pk")
        .first()
    )


def forecast_freshness(farm, forecast_date: date, *, now=None):
    """Return a centralized state for a date without treating unknown as safe."""
    if farm.latitude is None or farm.longitude is None:
        return {"status": "MISSING_COORDINATES", "record": None, "run": None}
    record = latest_usable_forecast(farm, forecast_date)
    if record is None:
        return {"status": "UNAVAILABLE", "record": None, "run": None}
    run = record.forecast_run
    now = now or timezone.now()
    if now - run.fetched_at > timedelta(hours=FRESHNESS_HOURS):
        status = "STALE"
    elif run.status == WeatherForecastRun.Status.PARTIAL or any(
        value is None
        for value in (
            record.precipitation_mm,
            record.temperature_min_c,
            record.temperature_max_c,
        )
    ):
        status = "PARTIAL"
    else:
        status = "FRESH"
    return {"status": status, "record": record, "run": run}


def forecast_history(farm, forecast_date: date):
    """Return every version for a day, newest first, including migrated history."""
    return (
        WeatherRecord.objects.filter(
            forecast_run__farm=farm,
            forecast_date=forecast_date,
        )
        .select_related("forecast_run")
        .order_by("-forecast_run__fetched_at", "-forecast_run_id", "-pk")
    )
