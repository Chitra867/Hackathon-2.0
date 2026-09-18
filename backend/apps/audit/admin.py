"""
Admin configuration for audit app.
"""

from django.contrib import admin
from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'actor', 'action', 'entity_type', 'entity_id',
        'ip_address', 'description_short',
    ]
    list_filter = ['action', 'entity_type', 'created_at']
    search_fields = ['actor__username', 'description', 'entity_id', 'entity_type', 'ip_address']
    ordering = ['-created_at']
    readonly_fields = [
        'actor', 'action', 'entity_type', 'entity_id',
        'description', 'ip_address', 'created_at', 'metadata',
    ]
    date_hierarchy = 'created_at'

    def description_short(self, obj):
        return obj.description[:80] + '...' if len(obj.description) > 80 else obj.description
    description_short.short_description = 'Description'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
