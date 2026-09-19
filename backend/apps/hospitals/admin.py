"""
Admin configuration for hospitals app.
"""

from django.contrib import admin
from django.utils.html import format_html
from apps.hospitals.models import Hospital, Service, HospitalService, Availability


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'type', 'district', 'municipality',
        'phone', 'verification_badge', 'active_badge', 'created_at',
    ]
    list_filter = ['type', 'verification_status', 'is_active', 'district']
    search_fields = ['name', 'district', 'municipality', 'address', 'phone', 'email']
    ordering = ['district', 'name']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 30

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'type', 'verification_status', 'is_active'),
        }),
        ('Location', {
            'fields': ('address', 'district', 'municipality', 'latitude', 'longitude'),
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website', 'emergency_contact'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def verification_badge(self, obj):
        colors = {
            'verified': '#15803d',
            'pending': '#b45309',
            'rejected': '#b91c1c',
        }
        color = colors.get(obj.verification_status, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_verification_status_display()
        )
    verification_badge.short_description = 'Status'

    def active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#15803d;font-weight:bold">✓ Active</span>')
        return format_html('<span style="color:#b91c1c">✗ Inactive</span>')
    active_badge.short_description = 'Active'


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category_display', 'is_active', 'description_short']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_per_page = 30

    fieldsets = (
        ('Service Details', {
            'fields': ('name', 'category', 'description', 'is_active'),
        }),
    )

    def category_display(self, obj):
        return obj.get_category_display()
    category_display.short_description = 'Category'

    def description_short(self, obj):
        if not obj.description:
            return '—'
        return obj.description[:60] + '…' if len(obj.description) > 60 else obj.description
    description_short.short_description = 'Description'


@admin.register(HospitalService)
class HospitalServiceAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'service', 'available_badge', 'notes_short']
    list_filter = ['is_available', 'service__category', 'hospital__district']
    search_fields = ['hospital__name', 'service__name']
    ordering = ['hospital__name', 'service__name']
    list_per_page = 50
    raw_id_fields = ['hospital', 'service']

    fieldsets = (
        ('Assignment', {
            'fields': ('hospital', 'service', 'is_available', 'notes'),
        }),
    )

    def available_badge(self, obj):
        if obj.is_available:
            return format_html('<span style="color:#15803d;font-weight:bold">✓ Available</span>')
        return format_html('<span style="color:#b91c1c">✗ Unavailable</span>')
    available_badge.short_description = 'Available'

    def notes_short(self, obj):
        if not obj.notes:
            return '—'
        return obj.notes[:50] + '…' if len(obj.notes) > 50 else obj.notes
    notes_short.short_description = 'Notes'


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = [
        'hospital', 'availability_type_display', 'status_badge',
        'available_count', 'total_count',
        'updated_by', 'source', 'updated_at',
    ]
    list_filter = [
        'availability_type', 'status', 'source',
        'is_active', 'hospital__district',
    ]
    search_fields = ['hospital__name', 'notes']
    ordering = ['-updated_at']
    readonly_fields = ['updated_at']
    raw_id_fields = ['hospital', 'service', 'updated_by']
    list_per_page = 30

    fieldsets = (
        ('Availability Record', {
            'fields': (
                'hospital', 'service', 'availability_type',
                'status', 'available_count', 'total_count', 'notes',
            ),
        }),
        ('Metadata', {
            'fields': ('updated_by', 'source', 'is_active', 'updated_at'),
        }),
    )

    def availability_type_display(self, obj):
        return obj.get_availability_type_display()
    availability_type_display.short_description = 'Type'

    STATUS_COLORS = {
        'available': '#15803d',
        'limited': '#b45309',
        'unavailable': '#b91c1c',
        'full': '#7c3aed',
        'unknown': '#6b7280',
    }

    def status_badge(self, obj):
        color = self.STATUS_COLORS.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
