from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages

from farms.models import Farm
from monitoring.models import RiskAlert
from monitoring.services.risk import evaluate_farm_risk


def home(request):
  if request.user.is_authenticated:
    return redirect('core:dashboard')
  else:
    return render(request, 'core/home.html')

@login_required
def dashboard(request):
  farms = Farm.objects.filter(owner=request.user).prefetch_related("inventory__feed_type")
  farm_summaries = []
  for farm in farms:
    try:
      result = evaluate_farm_risk(farm, persist=False)
    except Exception:
      result = {
        "risk_level": "UNKNOWN",
        "explanation": "A current assessment is unavailable for this farm.",
        "weather": {"status": "UNAVAILABLE", "indicators": []},
      }
    farm_summaries.append({"farm": farm, "risk": result, "inventory": farm.inventory.all()})
  context = {
    "user": request.user,
    "farms": farms,
    "farm_summaries": farm_summaries,
    "farm_count": farms.count(),
    "active_alerts": RiskAlert.objects.filter(farm__owner=request.user, status__in=[RiskAlert.Status.ACTIVE, RiskAlert.Status.ACKNOWLEDGED]).select_related("farm").order_by("-created_at"),
  }
  return render(request, "core/dashboard.html", context)


@login_required
def farm_list(request):
  return render(request, "farms/farm_list.html", {"farms": Farm.objects.filter(owner=request.user)})


@login_required
def farm_detail(request, farm_id):
  from django.shortcuts import get_object_or_404
  from weather.services.forecasts import forecast_freshness, last_successful_retrieval
  from weather.views import _farm_local_today
  farm = get_object_or_404(Farm, pk=farm_id, owner=request.user)
  result = evaluate_farm_risk(farm, persist=False)
  today = _farm_local_today()
  return render(request, "farms/farm_detail.html", {
    "farm": farm, "risk": result, "inventory": farm.inventory.select_related("feed_type"),
    "weather": forecast_freshness(farm, today), "last_retrieval": last_successful_retrieval(farm),
  })


@login_required
def farm_form(request, farm_id=None):
  from django.shortcuts import get_object_or_404
  from farms.forms import FarmForm
  farm = get_object_or_404(Farm, pk=farm_id, owner=request.user) if farm_id else None
  if request.method == "POST":
    form = FarmForm(request.POST, instance=farm)
    if form.is_valid():
      saved = form.save(commit=False)
      if farm is None:
        saved.owner = request.user
      saved.save()
      return redirect("core:farm_detail", farm_id=saved.pk)
  else:
    form = FarmForm(instance=farm)
  return render(request, "farms/farm_form.html", {"form": form, "farm": farm})


@login_required
def inventory_list(request, farm_id):
  from django.shortcuts import get_object_or_404
  from farms.services.inventory import get_inventory_status
  farm = get_object_or_404(Farm, pk=farm_id, owner=request.user)
  inventory = list(farm.inventory.select_related("feed_type"))
  for item in inventory:
    item.status_label = get_inventory_status(item)
  return render(request, "farms/inventory_list.html", {"farm": farm, "inventory": inventory})


@login_required
def alerts(request):
  items = RiskAlert.objects.filter(farm__owner=request.user).select_related("farm", "evaluation")
  return render(request, "monitoring/alerts.html", {"alerts": items})


@login_required
def alert_detail(request, alert_id):
  from django.shortcuts import get_object_or_404
  alert = get_object_or_404(RiskAlert.objects.select_related("farm", "evaluation"), pk=alert_id, farm__owner=request.user)
  return render(request, "monitoring/alert_detail.html", {"alert": alert})


@login_required
@require_POST
def alert_action(request, alert_id, action):
  from django.shortcuts import get_object_or_404
  alert = get_object_or_404(RiskAlert, pk=alert_id, farm__owner=request.user)
  if action == "explain" and alert.evaluation_id:
    from monitoring.services.explanations import explain_evaluation
    explain_evaluation(alert.evaluation, force=True)
    return redirect("core:alert_detail", alert_id=alert.pk)
  if action == "acknowledge" and alert.status == RiskAlert.Status.ACTIVE:
    alert.status = RiskAlert.Status.ACKNOWLEDGED
  elif action == "resolve" and alert.status != RiskAlert.Status.RESOLVED:
    alert.status = RiskAlert.Status.RESOLVED
  else:
    messages.info(request, "That alert action is not available for its current state.")
    return redirect("core:alert_detail", alert_id=alert.pk)
  alert.save(update_fields=["status", "updated_at"])
  return redirect("core:alert_detail", alert_id=alert.pk)
