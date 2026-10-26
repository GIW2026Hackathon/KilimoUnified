# MaziwaShield

## Weather forecasts

Weather forecasts use the Open-Meteo Forecast API from the Django weather service layer. The standard forecast endpoint is used without an API key for eligible free use. The API client requests daily precipitation sum and minimum/maximum 2 m temperatures, uses the configured timezone, and applies a finite socket timeout. Provider data is licensed under CC BY 4.0; this application links to Open-Meteo attribution on the farm forecast page. Review [Open-Meteo terms](https://open-meteo.com/en/terms) before production use: free API use is non-commercial and subject to rate limits. Commercial deployments should use an applicable paid plan.

### Farm coordinates

Staff may enter coordinates in Django Admin under Farms. Latitude and longitude are optional, but must be supplied together, latitude must be between -90 and 90, and longitude must be between -180 and 180. Existing free-text farm location values are retained; they are not geocoded automatically. Farms without coordinates are skipped by the refresh command, and their forecast page explains what to update.

### Configuration and migrations

Defaults are configured in `config/settings.py` and may be overridden with:

- `WEATHER_FORECAST_DAYS` — forecast horizon, from 1 to 16 days; default 7.
- `WEATHER_PROVIDER_TIMEZONE` — IANA timezone used for API daily boundaries; default `Africa/Nairobi`.
- `WEATHER_HTTP_TIMEOUT_SECONDS` — finite HTTP socket timeout; default 15 seconds.

Apply schema updates with `python manage.py migrate`. The weather version migration preserves existing `WeatherRecord` rows by attaching each to a historical partial run. The old single temperature value is retained in `legacy_temperature_c`; it is not misrepresented as a daily minimum or maximum.

### Refresh scheduling

Run a manual refresh with:

`python manage.py refresh_weather`

To refresh one farm for testing or administration:

`python manage.py refresh_weather --farm-id 42`

The command writes a summary of success, partial, failed, and skipped farms, continues after individual failures, and never deletes prior forecast runs. Schedule it twice daily using the host scheduler rather than an in-process Django scheduler. For example, on a UTC-scheduled cron host:

`CRON_TZ=UTC 0 6,18 * * * /path/to/venv/bin/python /path/to/project/manage.py refresh_weather >> /var/log/maziwashield-weather.log 2>&1`

The scheduler timezone (UTC in this example) is independent of `WEATHER_PROVIDER_TIMEZONE`, which controls the forecast's local daily boundaries.

### Forecast selection and freshness

Each provider attempt creates a `WeatherForecastRun`; successful and partial runs own their own daily records, so refreshes preserve history. The latest usable version for a farm and date is selected deterministically by newest run retrieval time, then run ID and record ID. Failed runs are never selected as weather data. A partial response keeps missing values null.

The centralized freshness service reports:

- **Fresh** — latest usable record's run is no more than 24 hours old and contains all expected measurements.
- **Stale** — latest usable record is older than 24 hours.
- **Partial** — latest usable run or record has missing measurements.
- **Unavailable** — no usable record exists for the requested date.
- **Missing coordinates** — the farm does not have both coordinates.

Forecasts are indicators, not proof of feed availability, pasture condition, or feed shortage. Missing or stale weather must not be interpreted as a safe risk assessment.

### Tests

Run the weather tests with `python manage.py test weather` and the full project suite with `python manage.py test`. Tests mock provider HTTP responses and do not call the live API.
