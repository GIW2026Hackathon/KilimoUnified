from django.urls import path
from django.contrib.auth import views as auth_views

from . import views
from .forms import CustomAuthenticationForm

app_name = "accounts"

urlpatterns = [
  path(
    "login/",
    auth_views.LoginView.as_view(
      template_name="accounts/login.html",
      authentication_form=CustomAuthenticationForm,
      next_page="core:dashboard",
    ),
    name="login",
  ),
  path("logout/", views.log_out, name="logout"),
  path("register", views.register, name="register"),
]
