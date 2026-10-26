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
- `DJANGO_SECRET_KEY` — required stable secret for deployments; a transient random key is generated locally if unset.
- `RISK_HIGH_COVERAGE_DAYS` and `RISK_MEDIUM_COVERAGE_DAYS` — configurable provisional thresholds, default 7 and 14.
- `MAZIWASHIELD_AI_API_KEY`, `MAZIWASHIELD_AI_API_URL`, and `MAZIWASHIELD_AI_MODEL` — optional OpenAI-compatible explanation provider configuration.

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

## Run and configure the application

Use the project's Django 6.1 environment (the existing migrations use Django 6.1 constraint syntax). Install the pinned dependency with `pipenv install` (or install `Django==6.1.2` in your virtual environment). Set `DJANGO_SECRET_KEY` to a long random value in deployed environments; the development fallback is generated per process and invalidates sessions when the process restarts. Then run:

```sh
python manage.py migrate
python manage.py runserver
```

Authentication remains in the existing `accounts` app. Sign in, then use the dashboard to add farms and view farm, inventory, weather, and alert summaries. Farm coordinates are optional and must be entered together. Inventory rows are currently maintained through the existing Django admin and inventory service operations.

## Shortage risk and alerts

Run deterministic assessments for all farms or one farm with:

```sh
python manage.py evaluate_farm_risk
python manage.py evaluate_farm_risk --farm-id 42
```

Run the all-farms command on a regular host schedule (for example, once or twice daily) so current alerts track changing inventory; each farm is processed independently. The dashboard itself computes a non-persisted current summary and does not call external providers.

Usable feed uses the existing `FeedInventory.usable_stock_kg` property (physical stock less unusable and reserved quantities); coverage uses the existing `coverage_days` property. Initial operational defaults are **HIGH at 7 days or fewer**, **MEDIUM above 7 and through 14 days**, and **LOW above 14 days**. `RISK_HIGH_COVERAGE_DAYS` and `RISK_MEDIUM_COVERAGE_DAYS` may be set as environment values to adjust these defaults. Treat them as provisional and validate them with local dairy-farming practices before operational use. Invalid or inverted thresholds fall back to 7 and 14.

Unknown or missing consumption and missing inventory produce UNKNOWN when there is no known feed coverage. Where some feeds have usable coverage, the tightest known feed coverage drives the farm level. Each run is saved as an auditable `RiskEvaluation`; the current non-resolved alert is updated rather than duplicated on each evaluation, including when the result changes to UNKNOWN. A resolved alert remains historical, and the next evaluation creates a new current alert. Visiting pages never resolves alerts. Users can acknowledge or resolve alerts from the alert detail page.

Weather is queried through the existing versioned Open-Meteo service. Freshness, forecast dates, precipitation, and min/max temperatures are retained as contextual evidence. There are **no weather-driven risk adjustments**: no locally validated rule exists, and rainfall alone is not evidence of pasture condition or feed shortage. Missing or stale forecast data stays visibly missing or stale and does not make risk LOW. Routine page rendering does not call Open-Meteo; keep the existing twice-daily `refresh_weather` schedule.

## Optional AI explanation

The deterministic assessment is authoritative. No AI provider is required. To enable an OpenAI-compatible chat-completions endpoint, provide `MAZIWASHIELD_AI_API_KEY`, `MAZIWASHIELD_AI_API_URL`, and `MAZIWASHIELD_AI_MODEL` through the deployment environment; never put credentials in source or templates. Generate an explanation for a saved assessment explicitly:

Use **Explain this result** on an alert detail page, or run the command for a saved evaluation:

```sh
python manage.py explain_risk_evaluation 123
python manage.py explain_risk_evaluation 123 --refresh
```

The adapter sends only that evaluation's verified measurements, dates, freshness, rules, and permitted action, uses an 8-second timeout and short output limit, caches accepted output on the evaluation, and falls back to the deterministic explanation on missing configuration, invalid output, or provider failure. It rejects changed risk labels and numeric facts not present in the verified input. AI text cannot update a risk result. Avoid endpoints that retain request data unless permitted by your privacy policy.

Apply migrations with `python manage.py migrate`, run the full regression suite with `python manage.py test`, and verify the project with `python manage.py check` and `python manage.py makemigrations --check`. Deployers must configure secrets and environment-specific hosts, apply migrations, and keep scheduled weather refresh enabled. Forecast quality and the provisional inventory coverage cutoffs still require local operational validation.
