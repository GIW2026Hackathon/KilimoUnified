"""Deterministic inventory risk, with weather retained as context only."""
from decimal import Decimal, InvalidOperation
from datetime import timedelta
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from farms.models import Farm
from monitoring.models import RiskAlert, RiskEvaluation
from weather.services.forecasts import forecast_freshness, get_forecast_horizon

DEFAULT_HIGH_COVERAGE_DAYS = Decimal("7")
DEFAULT_MEDIUM_COVERAGE_DAYS = Decimal("14")
RANK = {"UNKNOWN": -1, "LOW": 0, "MEDIUM": 1, "HIGH": 2}


def _threshold(name, default):
    try:
        value = Decimal(str(getattr(settings, name, default)))
    except (InvalidOperation, TypeError, ValueError):
        return default
    if not value.is_finite() or value <= 0:
        return default
    return value


def _inventory_risk(coverage, high_days, medium_days):
    if coverage is None:
        return "UNKNOWN"
    if coverage <= high_days:
        return "HIGH"
    if coverage <= medium_days:
        return "MEDIUM"
    return "LOW"


def _farm_date(now):
    zone_name = getattr(settings, "WEATHER_PROVIDER_TIMEZONE", "Africa/Nairobi")
    try:
        zone = ZoneInfo(zone_name)
        return now.astimezone(zone).date()
    except (ZoneInfoNotFoundError, ValueError):
        return timezone.localdate(now)


def _recommendation(level, inventory_items):
    if level == "HIGH":
        return "Review the listed feed balances and arrange replenishment or a verified alternative for feed with 7 days or less of coverage."
    if level == "MEDIUM":
        return "Plan replenishment for feed with 14 days or less of coverage and confirm the recorded daily use is current."
    if level == "LOW":
        return "Continue routine stock checks and keep feed quantities and daily use up to date."
    return "Record a positive daily consumption value and inventory before relying on a coverage estimate."


def evaluate_farm_risk(farm, *, persist=True, now=None):
    """Evaluate a farm without changing stock or making external requests."""
    farm = Farm.objects.get(pk=farm.pk if isinstance(farm, Farm) else farm)
    now = now or timezone.now()
    high_days = _threshold("RISK_HIGH_COVERAGE_DAYS", DEFAULT_HIGH_COVERAGE_DAYS)
    medium_days = _threshold("RISK_MEDIUM_COVERAGE_DAYS", DEFAULT_MEDIUM_COVERAGE_DAYS)
    if medium_days <= high_days:
        high_days, medium_days = DEFAULT_HIGH_COVERAGE_DAYS, DEFAULT_MEDIUM_COVERAGE_DAYS

    items = []
    for inventory in farm.inventory.select_related("feed_type").all():
        coverage = inventory.coverage_days
        level = _inventory_risk(coverage, high_days, medium_days)
        items.append({
            "feed_type": inventory.feed_type.name,
            "stock_kg": str(inventory.stock_kg),
            "unusable_kg": str(inventory.unusable_kg),
            "reserved_kg": str(inventory.reserved_kg),
            "usable_stock_kg": str(inventory.usable_stock_kg),
            "daily_consumption_kg": str(inventory.daily_consumption_kg) if inventory.daily_consumption_kg is not None else None,
            "coverage_days": str(coverage) if coverage is not None else None,
            "inventory_risk_level": level,
            "rule_ids": [f"INVENTORY_COVERAGE_{level}"] if level != "UNKNOWN" else ["INVENTORY_COVERAGE_UNKNOWN"],
        })

    known = [row["inventory_risk_level"] for row in items if row["inventory_risk_level"] != "UNKNOWN"]
    inventory_level = max(known, key=lambda item: RANK[item]) if known else "UNKNOWN"
    level = inventory_level
    rules = sorted({rule for row in items for rule in row["rule_ids"]})
    if not items:
        rules = ["INVENTORY_MISSING"]
    elif not known:
        rules.append("COVERAGE_UNAVAILABLE")

    today = _farm_date(now)
    weather = forecast_freshness(farm, today, now=now)
    forecast_rows = []
    # Keep upcoming forecasts contextual; weather does not change risk absent validated policy.
    records = (
        get_forecast_horizon(farm, start_date=today)
        if farm.latitude is not None and farm.longitude is not None
        else []
    )
    for record in records:
        run = record.forecast_run
        is_stale = now - run.fetched_at > timedelta(hours=24)
        forecast_rows.append({
            "date": record.forecast_date.isoformat(),
            "precipitation_mm": str(record.precipitation_mm) if record.precipitation_mm is not None else None,
            "temperature_min_c": str(record.temperature_min_c) if record.temperature_min_c is not None else None,
            "temperature_max_c": str(record.temperature_max_c) if record.temperature_max_c is not None else None,
            "fetched_at": run.fetched_at.isoformat(),
            "freshness": "STALE" if is_stale else ("PARTIAL" if any(v is None for v in (record.precipitation_mm, record.temperature_min_c, record.temperature_max_c)) else "FRESH"),
        })
    explanations = {
        "HIGH": "At least one recorded feed has 7 days or less of usable coverage. Weather is contextual and did not set this level.",
        "MEDIUM": "The tightest known feed coverage is more than 7 and up to 14 days. Weather is contextual and did not set this level.",
        "LOW": "All recorded feed with known consumption has more than 14 days of usable coverage. Weather is contextual and did not set this level.",
        "UNKNOWN": "Coverage could not be calculated for this farm because inventory or positive daily consumption data is missing.",
    }
    recommendation = _recommendation(level, items)
    evidence = {
        "farm_id": farm.pk,
        "evaluation_date": today.isoformat(),
        "risk_level": level,
        "inventory_risk_level": inventory_level,
        "inventory": items,
        "weather": {"status": weather["status"], "fetched_at": weather["run"].fetched_at.isoformat() if weather["run"] else None, "indicators": forecast_rows, "influences_risk": False},
        "rule_ids": rules,
        "thresholds_days": {"high_max": str(high_days), "medium_max": str(medium_days)},
        "explanation": explanations[level],
        "recommended_action": recommendation,
    }
    result = {**evidence, "farm": farm, "evaluated_at": now}
    if persist:
        with transaction.atomic():
            evaluation = RiskEvaluation.objects.create(
                farm=farm, risk_level=level, inventory_risk_level=inventory_level,
                evidence=evidence, explanation=explanations[level], recommended_action=recommendation,
            )
            result["evaluation"] = evaluation
            alert = RiskAlert.objects.filter(
                farm=farm,
                status__in=[RiskAlert.Status.ACTIVE, RiskAlert.Status.ACKNOWLEDGED],
            ).order_by("-created_at", "-pk").first()
            if alert is None:
                alert = RiskAlert(farm=farm)
            alert.risk_level = level
            alert.message = explanations[level]
            alert.recommended_action = recommendation
            alert.evaluation = evaluation
            alert.save()
            result["alert"] = alert
    return result


def evaluate_all_farms(*, owner=None):
    """Evaluate every farm, allowing an individual failure to be reported."""
    farms = Farm.objects.all().order_by("pk")
    if owner is not None:
        farms = farms.filter(owner=owner)
    output = []
    for farm in farms:
        try:
            output.append({"farm_id": farm.pk, "result": evaluate_farm_risk(farm)})
        except Exception:
            output.append({"farm_id": farm.pk, "error": "Evaluation failed."})
    return output
