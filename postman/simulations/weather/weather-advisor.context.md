# Simulation context — weather-advisor

Generated 2026-10-27 from mocks: `postman/mocks/open-meteo`.
This file is how the next session starts without redoing the setup. Fill in each
@todo as you work, and update it when something you relied on turns out wrong.

## Purpose

Stands in for `https://api.open-meteo.com/v1/forecast` so the Django weather adapter can be exercised without depending on the live provider. The default route returns a sample 7-day forecast. The separate `weather-advisor-outage.sim.yaml` injects an HTTP 503 to verify graceful fallback.

## Execution

```sh
# start the simulation first
postman simulation run postman/simulations/weather/weather-advisor.sim.yaml \
  --port 3000 --output ndjson > /tmp/weather-advisor-simulation.log 2>&1 &

# In another terminal, point Django's weather adapter at the mock:
OPEN_METEO_API_URL=http://127.0.0.1:4910/openmeteo/v1/forecast \
  python manage.py runserver 127.0.0.1:8000

# Create/sign in to a farm with coordinates, then POST:
# http://127.0.0.1:8000/api/farms/{farm_id}/weather/refresh/
# The verified response had weather_refresh.status=SUCCESS and a stored daily indicator.

# what actually got called
grep '^{' /tmp/weather-advisor-simulation.log \
  | jq -r 'select(.event=="request") | [.routeKey, .method, .path, .statusCode] | @tsv' \
  | sort | uniq -c

# stop
pkill -INT -f "simulation run .*weather-advisor.sim.yaml"
```

<!-- @todo To intercept real hostnames instead of routing by routeKey, run with
     --proxy and a simulation.yaml (see `postman simulation run --help`). An
     intercepted HTTPS host is TLS-terminated with a CA minted for that run and
     deleted on exit, so record how to read its path, never the path itself:
     export NODE_EXTRA_CA_CERTS=$(grep -o '/[^ ]*/certs/ca\.pem' <log> | head -1) -->
For the outage check use `weather-advisor-outage.sim.yaml` on port 4911 and change the Django URL to `http://127.0.0.1:4911/openmeteo/v1/forecast`. A session-authenticated user must own the farm; POST requests also need the CSRF cookie and `X-CSRFToken`. Restart the simulation after editing its handlers.

## Assumptions

The integration walkthrough used a temporary farm with Nakuru coordinates and removed that account and farm after checking both scenarios. The SQLite database had one pre-existing user and five farms before the temporary walkthrough; the temporary data was deleted afterward.

- **Requests with no matching mock are forwarded to the real host.**
  A passing run may have hit production. Check what got called for destinations
  you didn't expect and treat them as unmocked.

- **Mocks do not hot-reload.**
  Restart the simulation after editing a handler. Restarting the service is not enough.

- **Only HTTP dependencies are simulated.**
  Databases, caches and queues must run as real local instances.

- **Port 3000 must be free, and only one simulation runs at a time.**
  Startup fails, or the service reaches the wrong proxy.

## Observations

<!-- @todo After each run, replace the section below: which mocks got traffic,
     which got none, and anything surprising — unexpected statuses, unmocked
     destinations, behaviour the assumptions didn't predict. Last run only,
     summary not a request log. -->

<!-- begin:observations -->
The success simulation served two Open-Meteo requests (standalone contract probe and Django refresh), both HTTP 200. The outage simulation's route returned HTTP 503 to Django; the refresh endpoint returned HTTP 200 with status `FAILED`, a labelled fallback, and the last usable forecast retained. No live Open-Meteo call was used for these checks.
<!-- end:observations -->
