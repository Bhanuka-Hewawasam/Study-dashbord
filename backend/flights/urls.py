from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    FlightViewSet,
    FlightPlanView,
    StatsView,
    MonthlyReportView,
    SubjectsView,
    JourneyView,
)

router = DefaultRouter()
router.register(r"flights", FlightViewSet, basename="flight")

urlpatterns = [
    # Distinct subjects list (GET /api/subjects/)
    path("subjects/", SubjectsView.as_view(), name="subjects-list"),

    # FlightPlan endpoint (GET to retrieve, PUT/PATCH to update)
    path("flight-plan/", FlightPlanView.as_view(), name="flight-plan"),

    # Summary statistics endpoint
    path("stats/", StatsView.as_view(), name="study-stats"),

    # Monthly report endpoint (GET /api/reports/monthly/?month=YYYY-MM)
    path("reports/monthly/", MonthlyReportView.as_view(), name="monthly-report"),

    # Journey tracker milestone endpoint (GET /api/journey/)
    path("journey/", JourneyView.as_view(), name="journey"),

    # Router handles /flights/ and /flights/<id>/
    path("", include(router.urls)),
]
