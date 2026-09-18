"""
Admin configuration for hospitals app.
"""

from django.contrib import admin
from apps.hospitals.models import Hospital, Service, HospitalService, Availability


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'type', 'district', 'municipality',
        'phone', 'verification_status', 'is_active', 'created_at',
    ]
    list_filter = ['type', 'verification_status', 'is_active', 'district']
    search_fields = ['name', 'district', 'municipality', 'address', 'phone', 'email']
    ordering = ['district', 'name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'type', 'verification_status', 'is_active'),
        }),
        ('Location', {
            'fields': ('address', 'district', 'municipality', 'latitude', 'longitude'),
        }),
        ('Contact', {
            'fields': ('phone', 'email', 'website', 'emergency_contact'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(HospitalService)
class HospitalServiceAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'service', 'is_available', 'notes']
    list_filter = ['is_available', 'service__category', 'hospital__district']
    search_fields = ['hospital__name', 'service__name']
    autocomplete_fields = ['hospital', 'service']
    ordering = ['hospital__name', 'service__name']


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = [
        'hospital', 'availability_type', 'status',
        'available_count', 'total_count', 'freshness_label',
        'updated_by', 'source', 'updated_at',
    ]
    list_filter = [
        'availability_type', 'status', 'source',
        'is_active', 'hospital__district',
    ]
    search_fields = ['hospital__name', 'notes']
    ordering = ['-updated_at']
    readonly_fields = ['updated_at', 'freshness_label']
    autocomplete_fields = ['hospital', 'service']
    fieldsets = (
        ('Availability', {
            'fields': (
                'hospital', 'service', 'availability_type',
                'status', 'available_count', 'total_count', 'notes',
            ),
        }),
        ('Metadata', {
            'fields': ('updated_by', 'source', 'is_active', 'updated_at', 'freshness_label'),
        }),
    )
