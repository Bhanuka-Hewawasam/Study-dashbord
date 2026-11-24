from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from flights.models import Flight, FlightPlan


class StudyPilotAPITests(APITestCase):
    def setUp(self):
        # Base Daily Goal
        self.flight_plan = FlightPlan.load()
        self.flight_plan.daily_goal_minutes = 180
        self.flight_plan.save()

        # Sample study sessions with case variations
        now = timezone.now()
        self.flight1 = Flight.objects.create(
            subject="Java",
            notes="Spring Boot test session",
            start_time=now - timedelta(days=2, minutes=60),
            end_time=now - timedelta(days=2),
        )
        self.flight2 = Flight.objects.create(
            subject="java ",  # Should normalize to "Java"
            notes="Multithreading",
            start_time=now - timedelta(minutes=45),
            end_time=now,
        )
        self.flight3 = Flight.objects.create(
            subject="Algorithms",
            notes="Binary search trees",
            start_time=now - timedelta(days=1, minutes=90),
            end_time=now - timedelta(days=1),
        )

    def test_api_endpoints_are_public(self):
        paths = [
            "/api/flights/",
            "/api/subjects/",
            "/api/flight-plan/",
            "/api/stats/",
            "/api/reports/monthly/",
            "/api/journey/",
        ]
        for path in paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_route_is_removed(self):
        response = self.client.post("/api/auth/login/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ------------------------------------------------------------------
    # Flights CRUD
    # ------------------------------------------------------------------
    def test_get_flights_with_filters(self):
        """Test listing study sessions with subject and search filters."""
        # Filter by subject case-insensitively
        res_java = self.client.get("/api/flights/?subject=java")
        self.assertEqual(res_java.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_java.data), 2)

        # Text search
        res_search = self.client.get("/api/flights/?search=binary")
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]["subject"], "Algorithms")

    def test_subjects_endpoint(self):
        """Test GET /api/subjects/ returns case-insensitive normalized subjects sorted by recent."""
        response = self.client.get("/api/subjects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        # Should have 2 unique subjects: Java and Algorithms
        self.assertEqual(len(data), 2)

        # Java was used most recently (45 mins ago vs 1 day ago)
        self.assertEqual(data[0]["name"], "Java")
        self.assertEqual(data[0]["sessions_count"], 2)
        self.assertIn("last_used", data[0])

        self.assertEqual(data[1]["name"], "Algorithms")
        self.assertEqual(data[1]["sessions_count"], 1)

    def test_post_flight_publicly(self):
        now = timezone.now()
        payload = {
            "subject": "Database Systems",
            "notes": "Indexing mechanics",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(minutes=45)).isoformat(),
        }
        response = self.client.post("/api/flights/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["subject"], "Database Systems")
        self.assertEqual(response.data["duration_minutes"], 45)

    def test_get_and_patch_flight_plan(self):
        get_res = self.client.get("/api/flight-plan/")
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["daily_goal_minutes"], 180)

        patch_res = self.client.patch(
            "/api/flight-plan/",
            {"daily_goal_minutes": 240},
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["daily_goal_minutes"], 240)

    def test_stats_endpoint(self):
        response = self.client.get("/api/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("today_minutes", data)
        self.assertIn("week_minutes", data)
        self.assertIn("subject_breakdown", data)
        self.assertEqual(len(data["week_minutes"]), 7)

    def test_monthly_report_endpoint(self):
        now = timezone.now()
        current_month_str = now.strftime("%Y-%m")
        response = self.client.get(
            f"/api/reports/monthly/?month={current_month_str}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data["year"], now.year)
        self.assertEqual(data["month"], now.month)
        self.assertGreaterEqual(data["total_minutes"], 45)
        self.assertEqual(len(data["daily"]), data["total_days_in_month"])

    def test_journey_endpoint(self):
        response = self.client.get("/api/journey/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("total_hours", data)
        self.assertIn("unlocked_destinations", data)
        self.assertIn("next_destination", data)
        self.assertIn("milestones", data)
        self.assertEqual(len(data["milestones"]), 6)
        # Colombo is 0h, so it's always unlocked
        self.assertIn("CMB", data["unlocked_destinations"])
        # Next destination should be Chennai (10h) because total study is ~3.25 hrs (195 mins)
        self.assertEqual(data["next_destination"]["code"], "MAA")
        self.assertFalse(data["next_destination"]["is_unlocked"])
