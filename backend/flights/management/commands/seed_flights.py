from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from flights.models import Flight, FlightPlan


class Command(BaseCommand):
    help = "Seeds the database with initial Daily Goal and sample study sessions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing study session records before seeding.",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing StudyPilot seed sequence..."))

        if options["clear"]:
            deleted_count, _ = Flight.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Cleared {deleted_count} existing sessions."))

        # 1. Initialize Daily Goal
        plan = FlightPlan.load()
        plan.daily_goal_minutes = 180  # 3 hours daily target
        plan.save()
        self.stdout.write(self.style.SUCCESS(f"Daily Goal set: {plan.daily_goal_minutes} mins/day"))

        now = timezone.now()

        # 2. Sample study logs over the last 6 days up to today
        sample_sessions = [
            # 6 days ago
            {
                "days_ago": 6,
                "hour": 9,
                "duration_mins": 90,
                "subject": "Java",
                "notes": "Studied Spring Boot dependency injection, JPA entities, and multi-threading.",
            },
            {
                "days_ago": 6,
                "hour": 15,
                "duration_mins": 60,
                "subject": "Algorithms",
                "notes": "Practiced Dijkstra and Bellman-Ford shortest path algorithms.",
            },
            # 5 days ago
            {
                "days_ago": 5,
                "hour": 10,
                "duration_mins": 120,
                "subject": "Database Systems",
                "notes": "Deep dive into B+ Tree indexing, WAL (Write-Ahead Logging), and ACID isolation levels.",
            },
            # 4 days ago
            {
                "days_ago": 4,
                "hour": 14,
                "duration_mins": 150,
                "subject": "Mobile App Development",
                "notes": "Built React Native navigation, asynchronous state management, and offline cache.",
            },
            # 3 days ago
            {
                "days_ago": 3,
                "hour": 11,
                "duration_mins": 75,
                "subject": "Java",
                "notes": "Explored JVM garbage collection algorithms (G1, ZGC) and memory tuning.",
            },
            {
                "days_ago": 3,
                "hour": 16,
                "duration_mins": 85,
                "subject": "Algorithms",
                "notes": "Solved dynamic programming intervals and string alignment problems.",
            },
            # 2 days ago
            {
                "days_ago": 2,
                "hour": 10,
                "duration_mins": 180,
                "subject": "Mobile App Development",
                "notes": "Implemented push notification listeners and background work managers.",
            },
            # Yesterday
            {
                "days_ago": 1,
                "hour": 13,
                "duration_mins": 120,
                "subject": "Database Systems",
                "notes": "Query optimizer cost models, join algorithms (Hash Join, Sort-Merge).",
            },
            {
                "days_ago": 1,
                "hour": 17,
                "duration_mins": 60,
                "subject": "Algorithms",
                "notes": "Trie data structure and autocomplete prefix matching.",
            },
            # Today
            {
                "days_ago": 0,
                "hour": 9,
                "duration_mins": 75,
                "subject": "Java",
                "notes": "Created REST controller integration tests using MockMvc and Testcontainers.",
            },
            {
                "days_ago": 0,
                "hour": 14,
                "duration_mins": 45,
                "subject": "Database Systems",
                "notes": "PostgreSQL indexing strategies and vacuuming mechanisms.",
            },
        ]

        created_sessions = []
        for session in sample_sessions:
            session_day = now - timedelta(days=session["days_ago"])
            start_time = session_day.replace(
                hour=session["hour"],
                minute=0,
                second=0,
                microsecond=0
            )
            end_time = start_time + timedelta(minutes=session["duration_mins"])

            flight = Flight(
                subject=session["subject"],
                notes=session["notes"],
                start_time=start_time,
                end_time=end_time,
            )
            flight.save()
            created_sessions.append(flight)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully logged {len(created_sessions)} sessions across {len(sample_sessions)} entries!"
            )
        )
        self.stdout.write(self.style.SUCCESS("StudyPilot database ready."))
