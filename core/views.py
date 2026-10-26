from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required

from farms.models import Farm


def home(request):
  if request.user.is_authenticated:
    return redirect('core:dashboard')
  else:
    return render(request, 'core/home.html')

@login_required
def dashboard(request):
  context = {
    "user": request.user,
    "farms": Farm.objects.filter(owner=request.user),
  }
  return render(request, "core/dashboard.html", context)
