import os
from rest_framework import permissions


class HasPilotTokenOrReadOnly(permissions.BasePermission):
    """
    Custom permission for StudyPilot:
    - Safe methods (GET, HEAD, OPTIONS) are permitted so dashboards and readers work smoothly.
    - Write operations (POST, PUT, PATCH, DELETE) require a matching 'X-API-Token' header
      configured via the API_TOKEN environment variable.
    """
    message = "Access denied: Missing or invalid 'X-API-Token' header."

    def has_permission(self, request, view):
        # Allow read-only access freely
        if request.method in permissions.SAFE_METHODS:
            return True

        # Expected token from environment (fallback for easy local development)
        expected_token = os.environ.get("API_TOKEN", "pilot-secret-token")

        # Read the custom header (case-insensitive in request.headers)
        incoming_token = request.headers.get("X-API-Token") or request.META.get("HTTP_X_API_TOKEN")

        return bool(incoming_token and incoming_token == expected_token)
