from django.urls import path

from core import api

app_name = "api"

urlpatterns = [
    path("csrf/", api.csrf_token, name="csrf"),
    path("auth/register/", api.register_api, name="register"),
    path("auth/login/", api.login_api, name="login"),
    path("auth/me/", api.current_user, name="current_user"),
    path("auth/logout/", api.logout_api, name="logout"),
    path("farms/", api.farms_api, name="farms"),
    path("farms/<int:farm_id>/", api.farm_api, name="farm"),
    path("farms/<int:farm_id>/assessment/", api.assessment_api, name="assessment"),
    path("farms/<int:farm_id>/weather/refresh/", api.refresh_weather_api, name="weather_refresh"),
    path("assistant/", api.farm_assistant_api, name="assistant"),
]
