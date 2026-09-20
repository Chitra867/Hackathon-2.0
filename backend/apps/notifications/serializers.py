"""
Serializers for the notifications app.
"""

from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Read-only serializer for a single notification."""

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'link_url',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields


class NotificationMarkReadSerializer(serializers.Serializer):
    """Used for bulk-mark-as-read: accepts a list of notification IDs."""
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )
    mark_all = serializers.BooleanField(default=False)
