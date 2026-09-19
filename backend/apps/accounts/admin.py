"""
Admin configuration for accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'role', 'hospital', 'is_verified', 'is_active', 'date_joined',
    ]
    list_filter = ['role', 'is_active', 'is_verified', 'hospital', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('UpacharKhoj', {
            'fields': ('role', 'hospital', 'phone', 'is_verified'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('UpacharKhoj', {
            'fields': ('role', 'hospital', 'phone', 'is_verified'),
        }),
    )
