from django.contrib import admin
from .models import Flight, FlightPlan


@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ("id", "subject", "start_time", "end_time", "duration_minutes", "created_at")
    list_filter = ("subject", "start_time")
    search_fields = ("subject", "notes")
    readonly_fields = ("duration_minutes", "created_at")


@admin.register(FlightPlan)
class FlightPlanAdmin(admin.ModelAdmin):
    list_display = ("id", "daily_goal_minutes", "updated_at")
