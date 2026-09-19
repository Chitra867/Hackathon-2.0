"""
Admin configuration for accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'username', 'email', 'full_name_display', 'role_badge',
        'hospital', 'is_verified', 'is_active', 'date_joined',
    ]
    list_filter = ['role', 'is_active', 'is_verified', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']
    list_per_page = 30

    fieldsets = (
        ('Login Info', {
            'fields': ('username', 'password'),
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email', 'phone'),
        }),
        ('Role & Hospital', {
            'fields': ('role', 'hospital', 'is_verified'),
            'description': 'Assign role and associated hospital (required for hospital_admin/staff).',
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('date_joined', 'last_login'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        ('Create User', {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'first_name', 'last_name',
                'password1', 'password2',
                'role', 'hospital', 'phone', 'is_verified', 'is_active',
            ),
        }),
    )

    def full_name_display(self, obj):
        return obj.get_full_name() or '—'
    full_name_display.short_description = 'Name'

    ROLE_COLORS = {
        'system_admin': '#b91c1c',
        'hospital_admin': '#1d4ed8',
        'hospital_staff': '#0369a1',
        'health_worker': '#15803d',
        'patient': '#7c3aed',
    }

    def role_badge(self, obj):
        color = self.ROLE_COLORS.get(obj.role, '#6b7280')
        label = obj.get_role_display()
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, label
        )
    role_badge.short_description = 'Role'
