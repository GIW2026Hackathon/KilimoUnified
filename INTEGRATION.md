# Frontend and backend integration

This connects `maziwashield-frontend/` (Next.js App Router) to the existing Django app. The backend's existing server-rendered URLs remain available; JSON endpoints are under `/api/` and use Django session authentication.

## Pre-integration inventory and gap map

### Backend before the JSON API

The original backend rendered Django templates and exposed no JSON serializers. Existing routes and handlers:

| Path | Methods / view | Access and behavior |
|---|---|---|
| `/admin/` | Django admin | Django admin authentication; standard admin methods. |
| `/accounts/login/` | GET, POST; `LoginView` | Django session login, redirect to dashboard. |
| `/accounts/logout/` | POST; `accounts.views.log_out` | Logs out and redirects home. |
| `/accounts/register` | GET, POST; `accounts.views.register` | Form registration and session login; path has no trailing slash. |
| `/` | GET; `core.views.home` | Public landing page or redirect to dashboard if authenticated. |
| `/dashboard/` | GET; `core.views.dashboard` | Login required; owner-scoped farms and active alerts. |
| `/farms/` | GET; `core.views.farm_list` | Login required; owner-scoped farms. |
| `/farms/new/` | GET, POST; `core.views.farm_form` | Login required; existing form creates farm. |
| `/farms/{id}/` | GET; `core.views.farm_detail` | Login required; owner-scoped detail, risk, inventory and weather freshness. |
| `/farms/{id}/edit/` | GET, POST; `core.views.farm_form` | Login required; owner-scoped update. |
| `/farms/{id}/inventory/` | GET; `core.views.inventory_list` | Login required; inventory status. |
| `/alerts/` | GET; `core.views.alerts` | Login required; owner-scoped alerts. |
| `/alerts/{id}/` | GET; `core.views.alert_detail` | Login required; owner-scoped alert. |
| `/alerts/{id}/{action}/` | POST only; `core.views.alert_action` | Login required; acknowledge/resolve or generate optional AI explanation. |
| `/weather/farms/{id}/` | GET; `weather.views.farm_forecast` | Login required; owner-scoped stored forecast and freshness. |
| `/assistant/` | GET, POST; `assistantAnalytics.views.assistant` | Existing farm assistant; its own form/session behavior. |

`APPEND_SLASH` follows Django's default behavior (enabled); the registration page is the existing exception without a trailing slash. All existing writes use Django CSRF middleware; templates use Django forms and authentication. No serializers existed, so the new API views validate input and return `JsonResponse` directly.

Relevant existing models are `accounts.User`; `farms.Farm`, `FeedType`, `FeedInventory`; `weather.WeatherForecastRun`, `WeatherRecord`; and `monitoring.RiskEvaluation`, `RiskAlert`. Farm coordinate pair/range rules live in `Farm.clean()`, model validators, and DB constraints. Inventory quantities are nonnegative and bounded against stock by validators/constraints; usable stock is stock minus unusable and reserved; coverage days is usable stock divided by positive daily consumption.

Existing inventory risk rules are deterministic and weather-context-only: no coverage is `UNKNOWN`; coverage ≤7 days is `HIGH`; >7 through 14 days is `MEDIUM`; >14 days is `LOW`. The tightest known inventory coverage determines farm feed risk. Threshold settings are `RISK_HIGH_COVERAGE_DAYS` and `RISK_MEDIUM_COVERAGE_DAYS`, defaulting to 7 and 14. Existing action text prompts replenishment for high/medium, stock checks for low, or inventory recording when unknown. These thresholds measure stored feed coverage, not climate risk. Existing weather settings are `OPEN_METEO_API_URL`, `WEATHER_FORECAST_DAYS` (default 7, allowed 1–16 by service), `WEATHER_PROVIDER_TIMEZONE` (Africa/Nairobi), and `WEATHER_HTTP_TIMEOUT_SECONDS` (15). Weather runs persist `SUCCESS`, `PARTIAL`, or `FAILED`; provider errors are caught and previous usable forecasts remain available.

Relevant settings include Django session/authentication and CSRF middleware, SQLite, CORS origin and cookie settings described below. `FarmForm` originally allowed name, county, location, and coordinates only; the additive migration adds herd, milk litres, and KES/litre fields. The weather provider client validates ISO dates, units, decimals, and temperatures. No backend serializer library or API auth token setting was present.

### Frontend before integration

The frontend is Next.js 14 with the **App Router** under `src/app/`, React Query 5, React Hook Form/Zod, and Tailwind CSS. Existing routes were `/`, `/login`, `/register`, `/dashboard`, `/farms`, and dynamic `/farms/[farmId]`. Dashboard, farms and detail pages used a static demo farm array and dashboard mock cards; auth API helpers were stubs. There were no working backend fetches or API types. The frontend had forms and shared layout/navigation components but no live data loading/error/empty states. Existing UX included unsupported coop, USSD, and procurement claims; operational navigation was narrowed to the MVP screens. Dynamic detail IDs required removing the prior static-export setting.

### Need-to-endpoint comparison

| Frontend need | Backend endpoint | Status before integration | Resolution |
|---|---|---|---|
| Sign in/register | Existing HTML `/accounts/login/`, `/accounts/register` | Shape mismatch | Added session JSON endpoints; registration creates farm profile. |
| Dashboard farm summary | Existing HTML `/dashboard/` | Missing JSON endpoint | `GET /api/farms/`. |
| Climate indicators and refresh | Existing HTML `/weather/farms/{id}/`; Open-Meteo service only | Shape mismatch | Farm payload returns forecast/freshness; added JSON refresh. Risk category remains unavailable without thresholds. |
| Feed status | Existing inventory risk service | Field/shape mismatch | Reused existing `evaluate_farm_risk`; JSON exposes feed status and item coverage. |
| Feed deficit and costs | No calculation endpoint or farm milk fields | Missing on backend | Added farm profile fields and `POST /api/farms/{id}/assessment/`. |
| Revenue scenario loss | No milk financial fields or scenario endpoint | Missing on backend | Farm stores daily milk and KES/litre; assessment requires explicit reduction %. |
| Recommended actions | Existing inventory-only rule-based text and assistant | Shape mismatch | Assessment returns generic early shortfall advice and local extension referral. |
| Farm list and details | Existing HTML `/farms/` and `/farms/{id}/` | Shape mismatch | Added JSON list/detail with owner scoping. |

Cross-cutting differences: backend was template/session based while frontend expected mock/stub JSON; no CORS/JSON contract/API base env existed. Django uses snake_case and decimal strings; frontend uses camelCase and renders localized KES/decimal values. Forecast dates are ISO calendar dates interpreted in Africa/Nairobi; weather units are mm and °C; feed uses kg dry matter; milk uses litres. The API layer maps key casing once and preserves decimal strings in its types.

## API endpoints

Successful application responses and application-level errors are JSON. Private routes require a session cookie. Mutating requests require the CSRF cookie plus `X-CSRFToken`; call `GET /api/csrf/` first (the frontend refreshes it after login because Django rotates the CSRF token). Application validation errors use `{ "error": { "code": "...", "message": "...", "fields": { "field_name": "..." } } }`. Django's framework-generated CSRF and unsupported-method responses may use its default HTML response.

| Method | Path | Request | Success response | Errors |
|---|---|---|---|---|
| GET | `/api/csrf/` | — | `{csrf_token}`; sets CSRF cookie | 405 |
| POST | `/api/auth/register/` | `full_name`, `phone`, optional `email`, `password`, `farm_name`, `county`, `herd_size`, `average_daily_milk_litres`, `milk_price_per_litre_kes`, optional `latitude` and `longitude` | 201 `{user, farm}` and authenticated session | 400 field errors; 403 CSRF |
| POST | `/api/auth/login/` | `{username, password}`; authenticates using Django's configured username backend | `{user}` and authenticated session | 400 authentication/validation error; 403 CSRF |
| GET | `/api/auth/me/` | Session cookie | `{user}` | 401 |
| POST | `/api/auth/logout/` | `{}` | `{ok: true}` | 403 CSRF |
| GET | `/api/farms/` | Session cookie | `{farms: Farm[]}` | 401 |
| GET | `/api/farms/{farm_id}/` | Session cookie | `{farm}` | 401, 404 |
| POST | `/api/farms/{farm_id}/assessment/` | `available_feed_kg`, `required_feed_kg`, `feed_price_per_kg_kes`, `production_reduction_percent`, `period_days` | `{assessment}` with calculation, assumptions, units, and recommended actions | 400 field errors, 401, 404, 403 CSRF |
| POST | `/api/farms/{farm_id}/weather/refresh/` | `{}` | `{farm, weather_refresh}` | 401, 404, 403 CSRF; provider failure is returned as HTTP 200 with `status: FAILED` and a labelled fallback |

Farm and forecast values use snake_case on the wire. Quantities are kg dry matter, prices and financial totals are KES, milk is litres, precipitation is mm, temperature is °C, and forecast dates are ISO `YYYY-MM-DD`. The sole frontend API layer converts keys to camelCase. Monetary and decimal values are JSON strings to preserve decimal precision; herd size and IDs are integers.

## Calculation and behaviour decisions

- The deficit uses `max(0, required kg DM − farmer-entered usable available kg DM)` for the selected period. Existing inventory does not have a documented conversion to the period total, so it is shown as feed status and is not silently substituted into this calculation.
- Extra feed cost is deficit × entered KES/kg DM.
- Baseline revenue is stored average daily milk litres × stored KES/litre × period days. The farmer enters an explicit production-reduction percentage for scenario revenue; loss is baseline minus scenario. This is an estimate, not a forecast or guarantee.
- Existing backend inventory risk rules continue to drive feed status. No validated climate thresholds were present in code or the supplied SRS, so climate category is `UNAVAILABLE`; weather indicators and freshness are shown without inventing cutoffs. This means SRS acceptance criterion 3 is not verified pending validated rules.
- Crop-specific recommendations are not invented; farmers are directed to county agricultural extension for local suitability guidance.
- JSON API and farm-profile fields are additive. New routes: all routes in the endpoint table. New farm fields: herd size, average daily milk litres, and milk price per litre. No database model or route was replaced.

## Environment

Backend `.env.example`:

- `FRONTEND_ORIGIN`: the single allowed browser origin, default `http://localhost:3000`.
- `OPEN_METEO_API_URL`: Open-Meteo forecast URL.
- `DJANGO_SECRET_KEY`: set a private value outside source control.
- `SESSION_COOKIE_SAMESITE`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SAMESITE`, `CSRF_COOKIE_SECURE`: set `None` and `true` for cross-site HTTPS deployments; keep frontend and backend same-site when possible.

Frontend `maziwashield-frontend/.env.local.example`:

- `NEXT_PUBLIC_API_BASE_URL`: Django origin, default example `http://localhost:8000`.

The API uses credentialed CORS restricted to `FRONTEND_ORIGIN`, and the same origin is trusted for CSRF. Do not use wildcard CORS with session credentials.

## Local run commands

1. Backend: install dependencies from `Pipfile` (or use the existing `.venv`), copy `.env.example` to `.env`, then run `python manage.py migrate` and `.venv/bin/python manage.py runserver '[::]:8000'`. The frontend uses `http://localhost:8000`; binding Django on IPv6 also accepts browsers that resolve `localhost` to `::1`.
2. Frontend: from `maziwashield-frontend/`, install with `npm install`, copy `.env.local.example` to `.env.local`, then run `npm run dev`.
3. Open the frontend at `http://localhost:3000`. Registration creates a farmer and one farm profile; sign in with the Django username and password. For accounts created through this frontend registration form, the phone number is used as the username.

The frontend now requires the Next.js server runtime because farm detail routes use dynamic IDs; static export was removed. Use `npm run dev` for development and `npm run build && npm run start` for a production-mode local run.

## Verification record

- Django `check`: passed. Migration check: no unapplied model changes. Django suite: 89 tests discovered, 88 passed and one existing opt-in provider simulation test skipped.
- Local HTTP walkthrough: CSRF, registration, login, farm list, forecast refresh, assessment, invalid numeric fields, and logout passed. Weather provider success returned HTTP 200 and a stored indicator. A Postman simulation returned HTTP 503; Django returned HTTP 200 with `FAILED`, a fallback message, and retained last-good forecast.
- Hand check: 100 − 60 = 40 kg DM; 40 × KES 35 = KES 1,400; baseline 10 L/day × KES 50/L × 7 = KES 3,500; an explicit 20% reduction gives KES 700 estimated loss.
- Frontend `typecheck`, lint, and production build passed. The build needed network access for Next's Google font downloads; when those downloads failed it retried and completed using its fallback. Production build also exposed and the integration fixed a missing `APP_TAGLINE` export.
- Full browser automation was not available in this run. Frontend dashboard route compiled and returned HTTP 200 in development; API behavior was exercised directly over HTTP.

### SRS acceptance criteria

| Criterion | Status | Evidence / remaining gap |
|---|---|---|
| 1. Enter basic farm information | Verified | Registration form creates farm profile with location, herd, daily milk, price, optional coordinates. |
| 2. Retrieve/display climate information | Verified | Open-Meteo success simulation stored and returned weather indicators. |
| 3. Classify climate risk with documented logic | Not verified | No defensible thresholds supplied; category clearly remains unavailable. |
| 4. Calculate feed deficit | Verified | 40 kg DM hand-checked from sample input. |
| 5. Estimate feed cost and potential revenue loss | Verified | KES 1,400 and KES 700 calculated with stated units and explicit reduction assumption. |
| 6. Generate a relevant mitigation recommendation | Verified | Shortfall recommendation and county extension referral returned. |
| 7. Display results clearly on dashboard | Verified | Dashboard view uses live API data with loading, error, empty, and assumptions states; dashboard route returned HTTP 200. |

## Remaining question

Provide validated climate-risk rules or thresholds if the dashboard must classify Low, Moderate, and High. Until then it will not infer a category from weather values.
