"""
Serializers for audit app.
"""

from rest_framework import serializers
from apps.audit.models import AuditLog


class ActorSerializer(serializers.Serializer):
    """Minimal actor info for audit log."""
    id = serializers.IntegerField()
    username = serializers.CharField()
    role = serializers.CharField()


class AuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for audit logs."""
    actor_detail = ActorSerializer(source='actor', read_only=True)
    action_display = serializers.ReadOnlyField(source='get_action_display')

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_detail',
            'action', 'action_display',
            'entity_type', 'entity_id',
            'description', 'ip_address',
            'created_at', 'metadata',
        ]
        read_only_fields = fields
