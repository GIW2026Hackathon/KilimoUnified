from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from django.utils import timezone

from farms.models import Farm
from weather.services.forecasts import (
	forecast_freshness,
	get_forecast_horizon,
	last_successful_retrieval,
)


def _farm_local_today():
	zone_name = getattr(settings, "WEATHER_PROVIDER_TIMEZONE", "Africa/Nairobi")
	try:
		return datetime.now(ZoneInfo(zone_name)).date()
	except (ZoneInfoNotFoundError, ValueError):
		return timezone.localdate()


@login_required
def farm_forecast(request, farm_id):
	farm = get_object_or_404(Farm, pk=farm_id, owner=request.user)
	today = _farm_local_today()
	freshness = forecast_freshness(farm, today)
	return render(
		request,
		"weather/farm_forecast.html",
		{
			"farm": farm,
			"forecast_state": freshness["status"],
			"current_record": freshness["record"],
			"forecast_records": get_forecast_horizon(farm, start_date=today),
			"last_retrieval": last_successful_retrieval(farm),
		},
	)
