import calendar
from datetime import timedelta
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Flight, FlightPlan
from .serializers import FlightSerializer, FlightPlanSerializer


class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})


class FlightViewSet(viewsets.ModelViewSet):
    """
    CRUD API for individual study sessions:
    - GET /api/flights/?subject=&date_from=&date_to=&search= : List filtered sessions (newest first)
    - POST /api/flights/ : Create a new session
    - GET /api/flights/<id>/ : Retrieve single session details
    - PUT/PATCH /api/flights/<id>/ : Update a session
    - DELETE /api/flights/<id>/ : Delete a session
    """
    serializer_class = FlightSerializer

    def get_queryset(self):
        qs = Flight.objects.all().order_by("-start_time")

        # Filter by subject (case-insensitive)
        subject_param = self.request.query_params.get("subject")
        if subject_param and subject_param.strip():
            qs = qs.filter(subject__iexact=subject_param.strip())

        # Filter by date range (YYYY-MM-DD)
        date_from = self.request.query_params.get("date_from")
        if date_from and date_from.strip():
            qs = qs.filter(start_time__date__gte=date_from.strip())

        date_to = self.request.query_params.get("date_to")
        if date_to and date_to.strip():
            qs = qs.filter(start_time__date__lte=date_to.strip())

        # General text search (subject or notes)
        search_query = self.request.query_params.get("search")
        if search_query and search_query.strip():
            q_clean = search_query.strip()
            qs = qs.filter(Q(subject__icontains=q_clean) | Q(notes__icontains=q_clean))

        return qs


class SubjectsView(APIView):
    """
    GET /api/subjects/
    Returns the distinct subjects used before:
    - [{name, sessions_count, last_used}], sorted by most recently used first.
    - Case-insensitive and trimmed grouping (so 'java', 'Java ' and 'JAVA' count as one).
    """
    def get(self, request):
        flights = Flight.objects.all().order_by("-start_time")
        subjects_map = {}

        for f in flights:
            raw_name = (f.subject or "").strip()
            if not raw_name:
                continue

            norm_key = raw_name.lower()
            if norm_key not in subjects_map:
                subjects_map[norm_key] = {
                    "name": raw_name,
                    "sessions_count": 0,
                    "last_used": f.start_time,
                }

            subjects_map[norm_key]["sessions_count"] += 1
            if f.start_time > subjects_map[norm_key]["last_used"]:
                subjects_map[norm_key]["last_used"] = f.start_time

        # Sort by most recently used first
        sorted_subjects = sorted(
            subjects_map.values(),
            key=lambda s: s["last_used"],
            reverse=True
        )

        return Response(sorted_subjects)


class FlightPlanView(APIView):
    """
    API for retrieving and updating the daily study goal.
    - GET /api/flight-plan/ : Retrieve current daily goal
    - PUT / PATCH /api/flight-plan/ : Update daily study goal minutes
    """
    def get(self, request):
        plan = FlightPlan.load()
        serializer = FlightPlanSerializer(plan)
        return Response(serializer.data)

    def put(self, request):
        plan = FlightPlan.load()
        serializer = FlightPlanSerializer(plan, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        plan = FlightPlan.load()
        serializer = FlightPlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StatsView(APIView):
    """
    API endpoint calculating summary dashboard telemetry:
    - today_minutes: Minutes studied today
    - week_minutes: Per-day minutes for the last 7 days (including zero-study days)
    - subject_breakdown: Study time and percentage per subject
    - total_hours: All-time study hours
    - streak_days: Current active study streak in consecutive days
    """
    def get(self, request):
        now = timezone.now()
        today = timezone.localdate(now)

        # 1. Total minutes today
        today_minutes = (
            Flight.objects.filter(start_time__date=today).aggregate(
                total=Sum("duration_minutes")
            )["total"]
            or 0
        )

        # 2. Week breakdown (last 7 days in chronological order: today - 6 days through today)
        week_minutes = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_total = (
                Flight.objects.filter(start_time__date=day_date).aggregate(
                    total=Sum("duration_minutes")
                )["total"]
                or 0
            )
            week_minutes.append({
                "date": day_date.strftime("%Y-%m-%d"),
                "day": day_date.strftime("%a"),
                "minutes": day_total,
            })

        # 3. All-time total minutes and total hours
        all_time_minutes = (
            Flight.objects.aggregate(total=Sum("duration_minutes"))["total"] or 0
        )
        total_hours = round(all_time_minutes / 60.0, 1)

        # 4. Subject breakdown
        subject_data = (
            Flight.objects.values("subject")
            .annotate(minutes=Sum("duration_minutes"))
            .order_by("-minutes")
        )
        subject_breakdown = []
        for entry in subject_data:
            mins = entry["minutes"] or 0
            pct = round((mins / all_time_minutes * 100.0), 1) if all_time_minutes > 0 else 0.0
            subject_breakdown.append({
                "subject": entry["subject"],
                "minutes": mins,
                "percentage": pct,
            })

        # 5. Streak calculation
        flight_dates = set(Flight.objects.dates("start_time", "day"))

        streak_days = 0
        if today in flight_dates:
            streak_days = 1
            check_date = today - timedelta(days=1)
            while check_date in flight_dates:
                streak_days += 1
                check_date -= timedelta(days=1)
        else:
            yesterday = today - timedelta(days=1)
            if yesterday in flight_dates:
                streak_days = 1
                check_date = yesterday - timedelta(days=1)
                while check_date in flight_dates:
                    streak_days += 1
                    check_date -= timedelta(days=1)
            else:
                streak_days = 0

        flight_plan = FlightPlan.load()

        return Response({
            "today_minutes": today_minutes,
            "daily_goal_minutes": flight_plan.daily_goal_minutes,
            "week_minutes": week_minutes,
            "subject_breakdown": subject_breakdown,
            "total_hours": total_hours,
            "streak_days": streak_days,
        })


class MonthlyReportView(APIView):
    """
    Returns monthly study metrics and telemetry grouped by date:
    - GET /api/reports/monthly/?month=YYYY-MM (default: current month)
    """
    def get(self, request):
        now = timezone.now()
        current_local = timezone.localdate(now)

        month_param = request.query_params.get("month")
        if month_param:
            try:
                parts = month_param.strip().split("-")
                year, month = int(parts[0]), int(parts[1])
                if not (1 <= month <= 12):
                    raise ValueError
            except Exception:
                year, month = current_local.year, current_local.month
        else:
            year, month = current_local.year, current_local.month

        # Days in target month
        _, num_days = calendar.monthrange(year, month)

        # Target month study sessions
        month_flights = Flight.objects.filter(
            start_time__year=year,
            start_time__month=month
        ).order_by("start_time")

        total_minutes = month_flights.aggregate(total=Sum("duration_minutes"))["total"] or 0
        total_hours = round(total_minutes / 60.0, 1)

        # Daily study goal
        plan = FlightPlan.load()
        daily_goal_minutes = plan.daily_goal_minutes

        # Group sessions by session date (start_time__date)
        date_totals = {
            f"{year:04d}-{month:02d}-{day:02d}": 0
            for day in range(1, num_days + 1)
        }

        date_aggregated = (
            month_flights.values("start_time__date")
            .annotate(minutes=Sum("duration_minutes"))
        )
        for row in date_aggregated:
            d_key = row["start_time__date"].strftime("%Y-%m-%d")
            if d_key in date_totals:
                date_totals[d_key] = row["minutes"] or 0

        daily_list = [
            {"date": d_str, "day": int(d_str.split("-")[2]), "minutes": mins}
            for d_str, mins in sorted(date_totals.items())
        ]

        active_days = sum(1 for mins in date_totals.values() if mins > 0)
        avg_per_active_day = (
            round(total_minutes / active_days) if active_days > 0 else 0
        )
        goal_days_hit = sum(1 for mins in date_totals.values() if mins >= daily_goal_minutes)
        goal_hit_percentage = round((goal_days_hit / num_days) * 100, 1) if num_days > 0 else 0.0

        # Best day in the month
        best_day = None
        if total_minutes > 0:
            best_entry = max(date_totals.items(), key=lambda x: x[1])
            if best_entry[1] > 0:
                best_day = {"date": best_entry[0], "minutes": best_entry[1]}

        # Subject breakdown for this month
        subject_aggregated = (
            month_flights.values("subject")
            .annotate(minutes=Sum("duration_minutes"))
            .order_by("-minutes")
        )
        subject_breakdown = []
        for s in subject_aggregated:
            mins = s["minutes"] or 0
            pct = round((mins / total_minutes * 100.0), 1) if total_minutes > 0 else 0.0
            subject_breakdown.append({
                "subject": s["subject"],
                "minutes": mins,
                "percentage": pct,
            })

        # Previous month comparison
        if month == 1:
            prev_year = year - 1
            prev_month = 12
        else:
            prev_year = year
            prev_month = month - 1

        prev_month_flights = Flight.objects.filter(
            start_time__year=prev_year,
            start_time__month=prev_month
        )
        previous_month_total_minutes = (
            prev_month_flights.aggregate(total=Sum("duration_minutes"))["total"] or 0
        )

        if previous_month_total_minutes > 0:
            change_percentage = round(
                ((total_minutes - previous_month_total_minutes) / previous_month_total_minutes) * 100.0,
                1
            )
        else:
            change_percentage = 100.0 if total_minutes > 0 else 0.0

        # Detailed sessions for CSV download
        sessions_data = [
            {
                "id": f.id,
                "subject": f.subject,
                "date": f.start_time.strftime("%Y-%m-%d"),
                "duration_minutes": f.duration_minutes,
                "duration_hours": round(f.duration_minutes / 60.0, 2),
                "notes": f.notes or "",
            }
            for f in month_flights
        ]

        return Response({
            "year": year,
            "month": month,
            "month_name": calendar.month_name[month],
            "total_minutes": total_minutes,
            "total_hours": total_hours,
            "active_days": active_days,
            "total_days_in_month": num_days,
            "average_minutes_per_active_day": avg_per_active_day,
            "goal_days_hit": goal_days_hit,
            "goal_hit_percentage": goal_hit_percentage,
            "daily_goal_minutes": daily_goal_minutes,
            "best_day": best_day,
            "daily": daily_list,
            "subject_breakdown": subject_breakdown,
            "previous_month_total_minutes": previous_month_total_minutes,
            "change_percentage": change_percentage,
            "sessions": sessions_data,
        })


class JourneyView(APIView):
    """
    GET /api/journey/
    Returns study journey progress across global milestone destinations:
    Colombo (CMB, 0h) -> Chennai (MAA, 10h) -> Dubai (DXB, 25h) ->
    Singapore (SIN, 50h) -> Melbourne (MEL, 100h) -> London (LHR, 150h)
    """
    MILESTONES = [
        {
            "code": "CMB",
            "name": "Colombo",
            "city": "Colombo",
            "country": "Sri Lanka",
            "airport": "Bandaranaike International (CMB)",
            "target_hours": 0.0,
            "description": "Origin departure - Basecamp for your study journey",
        },
        {
            "code": "MAA",
            "name": "Chennai",
            "city": "Chennai",
            "country": "India",
            "airport": "Chennai International (MAA)",
            "target_hours": 10.0,
            "description": "First regional hop across the Palk Strait",
        },
        {
            "code": "DXB",
            "name": "Dubai",
            "city": "Dubai",
            "country": "United Arab Emirates",
            "airport": "Dubai International (DXB)",
            "target_hours": 25.0,
            "description": "Crossroads of innovation & global transit hub",
        },
        {
            "code": "SIN",
            "name": "Singapore",
            "city": "Singapore",
            "country": "Singapore",
            "airport": "Singapore Changi (SIN)",
            "target_hours": 50.0,
            "description": "Southeast Asian technology & financial beacon",
        },
        {
            "code": "MEL",
            "name": "Melbourne",
            "city": "Melbourne",
            "country": "Australia",
            "airport": "Melbourne Tullamarine (MEL)",
            "target_hours": 100.0,
            "description": "Southern hemisphere cultural & academic centre",
        },
        {
            "code": "LHR",
            "name": "London",
            "city": "London",
            "country": "United Kingdom",
            "airport": "London Heathrow (LHR)",
            "target_hours": 150.0,
            "description": "Transcontinental flagship study milestone",
        },
    ]

    def get(self, request):
        total_mins = Flight.objects.aggregate(total=Sum("duration_minutes"))["total"] or 0
        total_hours = round(total_mins / 60.0, 1)

        milestones_data = []
        unlocked_destinations = []
        next_destination = None

        prev_target = 0.0
        for m in self.MILESTONES:
            target = m["target_hours"]
            is_unlocked = total_hours >= target
            if is_unlocked:
                unlocked_destinations.append(m["code"])

            hours_remaining = max(0.0, round(target - total_hours, 1))

            if target == 0.0:
                progress_pct = 100.0
            elif total_hours >= target:
                progress_pct = 100.0
            else:
                leg_span = target - prev_target
                earned_in_leg = max(0.0, total_hours - prev_target)
                progress_pct = round(min(100.0, (earned_in_leg / leg_span) * 100.0), 1) if leg_span > 0 else 0.0

            m_item = {
                **m,
                "is_unlocked": is_unlocked,
                "hours_remaining": hours_remaining,
                "progress_pct": progress_pct,
            }
            milestones_data.append(m_item)

            if not is_unlocked and next_destination is None:
                next_destination = m_item

            prev_target = target

        if next_destination is None:
            final_m = milestones_data[-1]
            next_destination = {
                **final_m,
                "completed": True,
                "hours_remaining": 0.0,
                "progress_pct": 100.0,
            }

        return Response({
            "total_minutes": total_mins,
            "total_hours": total_hours,
            "unlocked_count": len(unlocked_destinations),
            "unlocked_destinations": unlocked_destinations,
            "next_destination": next_destination,
            "milestones": milestones_data,
        })

