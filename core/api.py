"""Small JSON API used by the Next.js farmer dashboard."""

import json
import re
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from farms.models import Farm
from assistantAnalytics.services.farm_assistant import answer_farm_question
from monitoring.services.risk import evaluate_farm_risk
from weather.services.forecasts import forecast_freshness, get_forecast_horizon, refresh_farm_forecast
from weather.views import _farm_local_today


def _error(message, *, status=400, code="validation_error", fields=None):
    payload = {"error": {"code": code, "message": message}}
    if fields:
        payload["error"]["fields"] = fields
    return JsonResponse(payload, status=status)


def _body(request):
    try:
        value = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, _error("Request body must be valid JSON.", code="invalid_json")
    if not isinstance(value, dict):
        return None, _error("Request body must be a JSON object.", code="invalid_json")
    return value, None


def _decimal(data, key, label, errors, *, required=True, minimum=Decimal("0"), maximum=None):
    raw = data.get(key)
    if raw in (None, ""):
        if required:
            errors[key] = f"{label} is required."
        return None
    if isinstance(raw, bool) or isinstance(raw, (dict, list)):
        errors[key] = f"Enter a valid number for {label.lower()}."
        return None
    try:
        value = Decimal(str(raw))
    except (InvalidOperation, TypeError, ValueError):
        errors[key] = f"Enter a valid number for {label.lower()}."
        return None
    if not value.is_finite():
        errors[key] = f"Enter a finite number for {label.lower()}."
    elif value < minimum:
        errors[key] = f"{label} must be at least {minimum}."
    elif maximum is not None and value > maximum:
        errors[key] = f"{label} must not exceed {maximum}."
    return value


def _phone(value):
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        digits = "254" + digits
    if len(digits) == 12 and digits.startswith("254") and digits[3] in "17":
        return "+" + digits
    return None


def _farm_payload(farm):
    result = evaluate_farm_risk(farm, persist=False)
    inventory = [
        {
            "feed_type": row["feed_type"],
            "stock_kg": row["stock_kg"],
            "usable_stock_kg": row["usable_stock_kg"],
            "daily_consumption_kg": row["daily_consumption_kg"],
            "coverage_days": row["coverage_days"],
            "inventory_risk_level": row["inventory_risk_level"],
        }
        for row in result["inventory"]
    ]
    today = _farm_local_today()
    freshness = forecast_freshness(farm, today)
    rows = get_forecast_horizon(farm, start_date=today)
    forecast = [
        {
            "date": row.forecast_date.isoformat(),
            "precipitation_mm": str(row.precipitation_mm) if row.precipitation_mm is not None else None,
            "temperature_min_c": str(row.temperature_min_c) if row.temperature_min_c is not None else None,
            "temperature_max_c": str(row.temperature_max_c) if row.temperature_max_c is not None else None,
            "fetched_at": row.forecast_run.fetched_at.isoformat(),
        }
        for row in rows
    ]
    return {
        "id": farm.pk,
        "name": farm.name,
        "county": farm.county,
        "location": farm.location,
        "latitude": str(farm.latitude) if farm.latitude is not None else None,
        "longitude": str(farm.longitude) if farm.longitude is not None else None,
        "herd_size": farm.herd_size,
        "average_daily_milk_litres": str(farm.average_daily_milk_litres) if farm.average_daily_milk_litres is not None else None,
        "milk_price_per_litre_kes": str(farm.milk_price_per_litre_kes) if farm.milk_price_per_litre_kes is not None else None,
        "feed_status": result["inventory_risk_level"],
        "feed_items": inventory,
        "climate_risk": {
            "level": "UNAVAILABLE",
            "status": freshness["status"],
            "assumption": "No locally validated climate-risk thresholds are configured; forecast data does not determine a risk category.",
            "indicators": forecast,
        },
        "assumptions": [
            "Feed status is based on the tightest known usable feed coverage.",
            "Usable feed excludes unusable and reserved stock.",
            "Weather is contextual and does not affect the current inventory-risk rules.",
            "Forecast values are daily precipitation in mm and minimum/maximum temperature in degrees Celsius.",
        ],
        "evaluated_at": timezone.now().isoformat(),
    }


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"csrf_token": get_token(request)})


@require_POST
def register_api(request):
    data, error = _body(request)
    if error:
        return error
    errors = {}
    full_name = str(data.get("full_name", "")).strip()
    if len(full_name) < 2:
        errors["full_name"] = "Enter your full name."
    elif len(full_name) > 150:
        errors["full_name"] = "Use 150 characters or fewer."
    phone = _phone(str(data.get("phone", "")))
    if phone is None:
        errors["phone"] = "Enter a valid Kenyan mobile number."
    email = str(data.get("email", "")).strip().lower()
    if email:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."
    password = data.get("password")
    if not isinstance(password, str) or not password:
        errors["password"] = "Password is required."
    farm_name = str(data.get("farm_name", "")).strip()
    county = str(data.get("county", "")).strip()
    if len(farm_name) < 2:
        errors["farm_name"] = "Enter your farm name."
    elif len(farm_name) > 150:
        errors["farm_name"] = "Use 150 characters or fewer."
    if not county:
        errors["county"] = "Select your county."
    elif len(county) > 100:
        errors["county"] = "Use 100 characters or fewer."
    herd = data.get("herd_size")
    if isinstance(herd, bool) or not str(herd or "").isdigit() or not 1 <= int(herd or 0) <= 5000:
        errors["herd_size"] = "Enter a whole number from 1 to 5000."
        herd = None
    profile_max = Decimal("99999999.99")
    milk = _decimal(data, "average_daily_milk_litres", "Average daily milk production (litres)", errors, minimum=Decimal("0.01"), maximum=profile_max)
    milk_price = _decimal(data, "milk_price_per_litre_kes", "Milk price per litre (KES)", errors, maximum=profile_max)
    latitude = _decimal(data, "latitude", "Latitude", errors, required=False, minimum=Decimal("-90"), maximum=Decimal("90"))
    longitude = _decimal(data, "longitude", "Longitude", errors, required=False, minimum=Decimal("-180"), maximum=Decimal("180"))
    if (latitude is None) != (longitude is None):
        errors["latitude"] = "Enter both coordinates or leave both blank."
        errors["longitude"] = "Enter both coordinates or leave both blank."
    if errors:
        return _error("Please correct the highlighted fields.", fields=errors)

    User = get_user_model()
    first_name, _, last_name = full_name.partition(" ")
    user = User(username=phone, phone_number=phone, email=email, first_name=first_name, last_name=last_name)
    try:
        validate_password(password, user)
    except ValidationError as exc:
        return _error("Please correct the highlighted fields.", fields={"password": list(exc.messages)})
    if User.objects.filter(phone_number=phone).exists():
        return _error("An account already uses this phone number.", fields={"phone": "This phone number is already registered."})
    if email and User.objects.filter(email__iexact=email).exists():
        return _error("An account already uses this email address.", fields={"email": "This email address is already registered."})

    try:
        with transaction.atomic():
            user.set_password(password)
            user.save()
            farm = Farm(
                owner=user,
                name=farm_name,
                county=county,
                location=county,
                latitude=latitude.quantize(Decimal("0.000001")) if latitude is not None else None,
                longitude=longitude.quantize(Decimal("0.000001")) if longitude is not None else None,
                herd_size=int(herd),
                average_daily_milk_litres=milk.quantize(Decimal("0.01")),
                milk_price_per_litre_kes=milk_price.quantize(Decimal("0.01")),
            )
            farm.full_clean()
            farm.save()
    except IntegrityError:
        return _error("An account already uses these details.", fields={"phone": "Check the phone number and try again."})
    login(request, user)
    return JsonResponse({"user": {"id": user.pk, "name": full_name, "phone": phone}, "farm": _farm_payload(farm)}, status=201)


@require_POST
def login_api(request):
    data, error = _body(request)
    if error:
        return error
    username = str(data.get("username", "")).strip()
    password = data.get("password")
    if not username or not isinstance(password, str) or not password:
        return _error("Enter your username and password.", fields={"username": "This field is required.", "password": "This field is required."})
    user = authenticate(request, username=username, password=password)
    if user is None:
        return _error("The supplied sign-in details were not recognized.", status=400, code="authentication_error")
    login(request, user)
    return JsonResponse({"user": {"id": user.pk, "name": user.get_full_name() or user.username, "phone": user.phone_number}})


def _require_user(request):
    if not request.user.is_authenticated:
        return _error("Sign in to access farm data.", status=401, code="authentication_required")
    return None


@require_GET
def current_user(request):
    error = _require_user(request)
    if error:
        return error
    user = request.user
    return JsonResponse({"user": {"id": user.pk, "name": user.get_full_name() or user.username, "phone": user.phone_number}})


@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({"ok": True})


@require_GET
def farms_api(request):
    error = _require_user(request)
    if error:
        return error
    farms = Farm.objects.filter(owner=request.user).prefetch_related("inventory__feed_type")
    return JsonResponse({"farms": [_farm_payload(farm) for farm in farms]})


@require_GET
def farm_api(request, farm_id):
    error = _require_user(request)
    if error:
        return error
    farm = Farm.objects.filter(owner=request.user, pk=farm_id).first()
    if farm is None:
        return _error("Farm not found.", status=404, code="not_found")
    return JsonResponse({"farm": _farm_payload(farm)})


@require_POST
def assessment_api(request, farm_id):
    error = _require_user(request)
    if error:
        return error
    farm = Farm.objects.filter(owner=request.user, pk=farm_id).first()
    if farm is None:
        return _error("Farm not found.", status=404, code="not_found")
    data, error = _body(request)
    if error:
        return error
    errors = {}
    quantity_max = Decimal("999999999999.99")
    price_max = Decimal("99999999.99")
    available = _decimal(data, "available_feed_kg", "Usable available feed (kg dry matter)", errors, maximum=quantity_max)
    required = _decimal(data, "required_feed_kg", "Feed required (kg dry matter)", errors, minimum=Decimal("0.01"), maximum=quantity_max)
    feed_price = _decimal(data, "feed_price_per_kg_kes", "Feed price per kg (KES)", errors, maximum=price_max)
    reduction = _decimal(data, "production_reduction_percent", "Production reduction assumption (%)", errors, maximum=Decimal("100"))
    days = data.get("period_days")
    try:
        period = int(days)
        if isinstance(days, bool) or str(period) != str(days) or not 1 <= period <= 365:
            raise ValueError
    except (TypeError, ValueError, OverflowError):
        errors["period_days"] = "Enter a whole number from 1 to 365 days."
        period = None
    if farm.average_daily_milk_litres is None:
        errors["average_daily_milk_litres"] = "Add average daily milk production to the farm profile first."
    if farm.milk_price_per_litre_kes is None:
        errors["milk_price_per_litre_kes"] = "Add the milk price per litre to the farm profile first."
    if errors:
        return _error("Please correct the highlighted fields.", fields=errors)

    deficit = max(Decimal("0"), required - available)
    extra_feed_cost = deficit * feed_price
    baseline = farm.average_daily_milk_litres * farm.milk_price_per_litre_kes * period
    scenario_revenue = baseline * (Decimal("1") - reduction / Decimal("100"))
    revenue_loss = baseline - scenario_revenue
    assessment = _farm_payload(farm)
    assessment.update({
        "calculation": {
            "period_days": period,
            "available_feed_kg": str(available),
            "required_feed_kg": str(required),
            "feed_deficit_kg": str(deficit),
            "feed_price_per_kg_kes": str(feed_price),
            "extra_feed_cost_kes": str(extra_feed_cost.quantize(Decimal("0.01"))),
            "baseline_revenue_kes": str(baseline.quantize(Decimal("0.01"))),
            "production_reduction_percent": str(reduction),
            "scenario_revenue_kes": str(scenario_revenue.quantize(Decimal("0.01"))),
            "estimated_revenue_loss_kes": str(revenue_loss.quantize(Decimal("0.01"))),
        },
        "financial_assumptions": [
            "Feed required and available quantities are farmer-entered kg of dry matter for the selected period.",
            "Feed deficit is max(0, required feed minus usable available feed).",
            "Extra feed cost is the deficit in kg dry matter multiplied by the farmer-entered KES/kg price.",
            "Baseline revenue assumes recorded average daily milk production and milk price remain constant for the selected period.",
            "Scenario revenue applies the farmer-entered production reduction percentage uniformly over the selected period; it is an estimate, not a forecast or guarantee.",
            "Revenue loss is baseline revenue minus scenario revenue. Savings are not estimated.",
        ],
        "recommended_actions": ([
            "Plan for the estimated feed shortfall early and check the feed price and quantity before purchasing.",
            "Ask the county agricultural extension service which fodder options suit this location; no crop-specific suitability data is available in the system.",
        ] if deficit > 0 else [
            "The entered usable feed covers the entered requirement for this period; keep quantities and daily requirements current.",
            "Ask the county agricultural extension service for location-specific fodder guidance before planting.",
        ]),
    })
    return JsonResponse({"assessment": assessment})


@require_POST
def refresh_weather_api(request, farm_id):
    error = _require_user(request)
    if error:
        return error
    farm = Farm.objects.filter(owner=request.user, pk=farm_id).first()
    if farm is None:
        return _error("Farm not found.", status=404, code="not_found")
    result = refresh_farm_forecast(farm)
    fallback = None
    if result["status"] == "FAILED":
        fallback = "Weather provider unavailable. The last usable forecast is retained if one exists; otherwise weather indicators remain unavailable."
    elif result["status"] == "SKIPPED":
        fallback = "Add both farm coordinates before requesting a weather forecast."
    return JsonResponse({
        "farm": _farm_payload(farm),
        "weather_refresh": {
            "status": result["status"],
            "reason": result.get("reason"),
            "fallback": fallback,
        },
    })


@require_POST
def farm_assistant_api(request):
    error = _require_user(request)
    if error:
        return error
    data, error = _body(request)
    if error:
        return error

    errors = {}
    farm_id = data.get("farm_id")
    if isinstance(farm_id, bool) or not str(farm_id or "").isdigit() or int(farm_id or 0) < 1:
        errors["farm_id"] = "Select a valid farm."
        farm_id = None
    question = data.get("question")
    if not isinstance(question, str):
        errors["question"] = "Enter a question."
        question = ""
    question = question.strip()
    if not question:
        errors["question"] = "Enter a question."
    elif len(question) > 1000:
        errors["question"] = "Use 1000 characters or fewer."
    if errors:
        return _error("Please correct the highlighted fields.", fields=errors)

    farm = Farm.objects.filter(owner=request.user, pk=farm_id).first()
    if farm is None:
        return _error("Farm not found.", status=404, code="not_found")
    result = answer_farm_question(farm, question)
    result["farm_id"] = farm.pk
    result["farm_name"] = farm.name
    return JsonResponse({"assistant": result})
