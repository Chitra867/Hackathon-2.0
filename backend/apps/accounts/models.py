"""
Custom User model for UpacharKhoj Nepal.
Extends Django's AbstractUser with role-based access and hospital association.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Extended user model supporting role-based access control.
    Roles determine what the user can see and do in the platform.
    """

    ROLES = [
        ('user', 'User'),
        ('health_worker', 'Health Worker'),
        ('hospital_staff', 'Hospital Staff'),
        ('hospital_admin', 'Hospital Admin'),
        ('system_admin', 'System Admin'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLES,
        default='user',
        verbose_name='Role'
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='Associated Hospital'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Phone Number'
    )
    is_verified = models.BooleanField(
        default=True,
        verbose_name='Is Verified'
    )

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    @property
    def is_normal_user(self):
        return self.role == 'user'

    @property
    def is_system_admin(self):
        return self.role == 'system_admin'

    @property
    def is_hospital_admin(self):
        return self.role in ('hospital_admin', 'system_admin')

    @property
    def is_hospital_staff_or_admin(self):
        return self.role in ('hospital_staff', 'hospital_admin', 'system_admin')

    @property
    def is_health_worker(self):
        return self.role == 'health_worker'
