"""
Views for audit app.
Read-only audit log access for system admins.
"""

import logging
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.accounts.permissions import IsSystemAdmin

logger = logging.getLogger(__name__)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for audit logs. System admin only.

    GET /api/audit/ - list all logs (filterable)
    GET /api/audit/{id}/ - detail
    """
    queryset = AuditLog.objects.select_related('actor').order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['action', 'entity_type', 'actor']
    search_fields = ['description', 'entity_id', 'entity_type', 'actor__username']
    ordering_fields = ['created_at', 'action', 'entity_type']
    ordering = ['-created_at']
