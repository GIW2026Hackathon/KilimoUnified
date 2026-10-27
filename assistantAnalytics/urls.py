from django.urls import path

from assistantAnalytics import views

app_name = "assistantAnalytics"

urlpatterns = [
    path("", views.assistant, name="ask"),
]
