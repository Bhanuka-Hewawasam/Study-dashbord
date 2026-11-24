"""
StudyPilot URL Configuration
"""
from django.urls import include, path

from flights.views import HealthView

urlpatterns = [
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/", include("flights.urls")),
]
