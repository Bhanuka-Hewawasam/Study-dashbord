import math
from django.db import models


class Flight(models.Model):
    """
    Represents a study session towards a topic/subject.
    """
    subject = models.CharField(
        max_length=150,
        help_text="Study subject (e.g., 'Java', 'Database Systems')"
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Study notes / session debrief"
    )
    start_time = models.DateTimeField(
        help_text="Session start timestamp"
    )
    end_time = models.DateTimeField(
        help_text="Session end timestamp"
    )
    duration_minutes = models.PositiveIntegerField(
        default=0,
        editable=False,
        help_text="Total duration in minutes, auto-calculated from start and end times"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when this study session was logged"
    )

    class Meta:
        ordering = ["-start_time"]
        verbose_name = "Study Session"
        verbose_name_plural = "Study Sessions"

    def save(self, *args, **kwargs):
        """
        Auto-calculate duration in minutes and canonicalize subject name before saving.
        """
        if self.subject:
            clean_sub = self.subject.strip()
            # Match existing subject case-insensitively to preserve canonical first-used casing
            existing = Flight.objects.filter(subject__iexact=clean_sub).exclude(pk=self.pk).first()
            if existing:
                self.subject = existing.subject
            else:
                self.subject = clean_sub

        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            total_seconds = max(0, delta.total_seconds())
            self.duration_minutes = int(math.ceil(total_seconds / 60.0))
        else:
            self.duration_minutes = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Study session for {self.subject} ({self.duration_minutes} min)"


class FlightPlan(models.Model):
    """
    Represents the daily study target in minutes (default 180 = 3 hours).
    Maintained as a single-row (singleton) configuration model.
    """
    daily_goal_minutes = models.PositiveIntegerField(
        default=180,
        help_text="Target daily study minutes (default 180 = 3 hours)"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily Goal"
        verbose_name_plural = "Daily Goal"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        plan, _ = cls.objects.get_or_create(
            pk=1,
            defaults={"daily_goal_minutes": 180}
        )
        return plan

    def __str__(self):
        return f"Daily Goal: {self.daily_goal_minutes} mins/day"
