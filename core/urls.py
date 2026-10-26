from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
  path('', views.home, name="home"),
  path('dashboard/', views.dashboard, name="dashboard"),
  path('farms/', views.farm_list, name="farm_list"),
  path('farms/new/', views.farm_form, name="farm_create"),
  path('farms/<int:farm_id>/', views.farm_detail, name="farm_detail"),
  path('farms/<int:farm_id>/edit/', views.farm_form, name="farm_edit"),
  path('farms/<int:farm_id>/inventory/', views.inventory_list, name="inventory_list"),
  path('alerts/', views.alerts, name="alerts"),
  path('alerts/<int:alert_id>/', views.alert_detail, name="alert_detail"),
  path('alerts/<int:alert_id>/<str:action>/', views.alert_action, name="alert_action"),
]
