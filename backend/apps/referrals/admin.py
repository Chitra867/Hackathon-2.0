"""
Admin configuration for referrals app.
"""

from django.contrib import admin
from apps.referrals.models import Referral, ReferralEvent


class ReferralEventInline(admin.TabularInline):
    model = ReferralEvent
    extra = 0
    readonly_fields = ['actor', 'old_status', 'new_status', 'note', 'created_at']
    can_delete = False


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = [
        'referral_code', 'referring_facility', 'destination_facility',
        'service', 'urgency', 'status', 'created_by', 'created_at',
    ]
    list_filter = [
        'urgency', 'status',
        'referring_facility__district',
        'destination_facility__district',
        'created_at',
    ]
    search_fields = [
        'referral_code',
        'patient_condition_summary',
        'referring_facility__name',
        'destination_facility__name',
        'created_by__username',
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'referral_code', 'created_at', 'updated_at', 'responded_at',
    ]
    inlines = [ReferralEventInline]
    fieldsets = (
        ('Referral Info', {
            'fields': (
                'referral_code', 'status', 'urgency',
                'referring_facility', 'destination_facility', 'service',
            ),
        }),
        ('Patient Info', {
            'fields': (
                'patient_age', 'patient_gender',
                'patient_condition_summary', 'reason',
            ),
        }),
        ('Users', {
            'fields': ('created_by', 'responded_by'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'responded_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(ReferralEvent)
class ReferralEventAdmin(admin.ModelAdmin):
    list_display = [
        'referral', 'actor', 'old_status', 'new_status', 'created_at',
    ]
    list_filter = ['new_status', 'old_status', 'created_at']
    search_fields = ['referral__referral_code', 'actor__username', 'note']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
