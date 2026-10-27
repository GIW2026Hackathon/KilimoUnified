from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from farms.models import Farm

from assistantAnalytics.forms import FarmQuestionForm
from assistantAnalytics.services.farm_assistant import answer_farm_question


@login_required
def assistant(request):
    farms = Farm.objects.filter(owner=request.user).order_by("name", "pk")
    result = None
    if request.method == "POST":
        form = FarmQuestionForm(request.POST, farms=farms)
        if form.is_valid():
            result = answer_farm_question(
                form.cleaned_data["farm"],
                form.cleaned_data["question"],
            )
    else:
        initial = {}
        requested_farm = request.GET.get("farm")
        if requested_farm:
            initial["farm"] = farms.filter(pk=requested_farm).first()
        elif farms.exists():
            initial["farm"] = farms.first()
        form = FarmQuestionForm(farms=farms, initial=initial)
    return render(request, "assistantAnalytics/assistant.html", {
        "form": form,
        "farms": farms,
        "result": result,
    })
