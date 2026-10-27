"""Small, replaceable Open-Meteo Forecast API client using the stdlib HTTP client."""

import json
import os
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


OPEN_METEO_URL = os.environ.get(
    "OPEN_METEO_API_URL",
    "https://api.open-meteo.com/v1/forecast",
).rstrip("/")
DAILY_VARIABLES = (
    "precipitation_sum",
    "temperature_2m_min",
    "temperature_2m_max",
)


class ForecastProviderError(Exception):
    """Safe, expected upstream/request/data failure."""


@dataclass(frozen=True)
class DailyForecast:
    forecast_date: date
    precipitation_mm: Decimal | None
    temperature_min_c: Decimal | None
    temperature_max_c: Decimal | None


@dataclass(frozen=True)
class ForecastPayload:
    records: tuple[DailyForecast, ...]
    provider_timezone: str | None
    is_partial: bool


def _decimal(value, *, precipitation=False) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (str, int, Decimal)):
        return None
    try:
        measurement = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    if not measurement.is_finite() or (precipitation and measurement < 0):
        return None
    try:
        measurement = measurement.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except InvalidOperation:
        return None
    return measurement if abs(measurement) <= Decimal("999999.99") else None


def parse_response(data) -> ForecastPayload:
    """Validate API JSON and normalize valid daily values; absent values stay None."""
    if not isinstance(data, dict):
        raise ForecastProviderError("Provider response was not a JSON object.")
    daily = data.get("daily")
    if not isinstance(daily, dict) or not isinstance(daily.get("time"), list):
        raise ForecastProviderError("Provider response omitted daily forecast dates.")
    dates = daily["time"]
    if not dates:
        raise ForecastProviderError("Provider returned no forecast dates.")

    units = data.get("daily_units")
    if not isinstance(units, dict):
        units = {}
    daily_arrays = {
        key: daily.get(key) if isinstance(daily.get(key), list) else None
        for key in DAILY_VARIABLES
    }
    expected_units = {
        "precipitation_sum": "mm",
        "temperature_2m_min": "°C",
        "temperature_2m_max": "°C",
    }
    unit_ok = {key: units.get(key) == unit for key, unit in expected_units.items()}

    output = []
    partial = not all(unit_ok.values())
    seen_dates = set()
    for index, raw_date in enumerate(dates):
        try:
            if not isinstance(raw_date, str):
                raise ValueError
            day = date.fromisoformat(raw_date)
            if day.isoformat() != raw_date:
                raise ValueError
        except ValueError:
            partial = True
            continue
        if day in seen_dates:
            partial = True
            continue
        seen_dates.add(day)

        values = {}
        for key in DAILY_VARIABLES:
            array = daily_arrays[key]
            raw_value = array[index] if array is not None and index < len(array) else None
            value = _decimal(raw_value, precipitation=(key == "precipitation_sum"))
            if not unit_ok[key]:
                value = None
            if value is None:
                partial = True
            values[key] = value

        min_temp = values["temperature_2m_min"]
        max_temp = values["temperature_2m_max"]
        if min_temp is not None and max_temp is not None and min_temp > max_temp:
            values["temperature_2m_min"] = None
            values["temperature_2m_max"] = None
            partial = True

        output.append(
            DailyForecast(
                forecast_date=day,
                precipitation_mm=values["precipitation_sum"],
                temperature_min_c=values["temperature_2m_min"],
                temperature_max_c=values["temperature_2m_max"],
            )
        )

    if not output or not any(
        row.precipitation_mm is not None
        or row.temperature_min_c is not None
        or row.temperature_max_c is not None
        for row in output
    ):
        raise ForecastProviderError("Provider returned no usable daily measurements.")

    timezone_name = data.get("timezone")
    if not isinstance(timezone_name, str) or not timezone_name.strip():
        timezone_name = None
        partial = True

    return ForecastPayload(tuple(output), timezone_name, partial)


def fetch_forecast(latitude, longitude, *, forecast_days=7, timezone="Africa/Nairobi", timeout=15):
    params = urlencode(
        {
            "latitude": str(latitude),
            "longitude": str(longitude),
            "daily": ",".join(DAILY_VARIABLES),
            "forecast_days": forecast_days,
            "timezone": timezone,
            "temperature_unit": "celsius",
            "precipitation_unit": "mm",
        }
    )
    request = Request(
        f"{OPEN_METEO_URL}?{params}",
        headers={"Accept": "application/json", "User-Agent": "MaziwaShield/1.0"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            status = response.getcode()
            body = response.read()
        if status < 200 or status >= 300:
            raise ForecastProviderError(f"Provider returned HTTP status {status}.")
    except HTTPError as error:
        raise ForecastProviderError(f"Provider returned HTTP status {error.code}.") from None
    except (URLError, TimeoutError, OSError) as error:
        reason = getattr(error, "reason", None)
        if isinstance(reason, TimeoutError) or isinstance(error, TimeoutError):
            raise ForecastProviderError("Connection to weather provider timed out.") from None
        raise ForecastProviderError("Could not connect to weather provider.") from None

    try:
        data = json.loads(body, parse_float=Decimal)
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
        raise ForecastProviderError("Provider returned invalid JSON.") from None
    return parse_response(data)
