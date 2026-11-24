from rest_framework import serializers
from .models import Flight, FlightPlan


class FlightSerializer(serializers.ModelSerializer):
    """
    Serializer for individual study flights.
    """
    class Meta:
        model = Flight
        fields = [
            "id",
            "subject",
            "notes",
            "start_time",
            "end_time",
            "duration_minutes",
            "created_at",
        ]
        read_only_fields = ["id", "duration_minutes", "created_at"]

    def validate(self, attrs):
        """
        Validate that touchdown (end_time) occurs after takeoff (start_time).
        """
        start = attrs.get("start_time") or (self.instance.start_time if self.instance else None)
        end = attrs.get("end_time") or (self.instance.end_time if self.instance else None)

        if start and end and end < start:
            raise serializers.ValidationError({
                "end_time": "Touchdown (end_time) cannot be earlier than Take Off (start_time)."
            })
        return attrs


class FlightPlanSerializer(serializers.ModelSerializer):
    """
    Serializer for the pilot's daily flight goal.
    """
    class Meta:
        model = FlightPlan
        fields = ["id", "daily_goal_minutes", "updated_at"]
        read_only_fields = ["id", "updated_at"]

    def validate_daily_goal_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError("Daily goal minutes must be greater than 0.")
        return value
