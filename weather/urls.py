from django.urls import path

from weather import views

app_name = "weather"

urlpatterns = [
    path("farms/<int:farm_id>/", views.farm_forecast, name="farm_forecast"),
]
