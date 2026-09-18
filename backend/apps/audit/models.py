"""
Audit log model for UpacharKhoj Nepal.
Tracks all significant actions across the platform.
"""

from django.db import models


class AuditLog(models.Model):
    """
    Immutable audit trail for platform events.
    Records who did what, when, and from where.
    """

    ACTION_CHOICES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Record Created'),
        ('update', 'Record Updated'),
        ('delete', 'Record Deleted'),
        ('status_change', 'Status Changed'),
        ('referral_create', 'Referral Created'),
        ('referral_response', 'Referral Response'),
        ('referral_status_update', 'Referral Status Updated'),
        ('availability_update', 'Availability Updated'),
        ('hospital_create', 'Hospital Created'),
        ('hospital_update', 'Hospital Updated'),
        ('user_create', 'User Created'),
        ('user_update', 'User Updated'),
        ('password_change', 'Password Changed'),
        ('register', 'User Registered'),
        ('other', 'Other'),
    ]

    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Actor'
    )
    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
        verbose_name='Action'
    )
    entity_type = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Entity Type'
    )
    entity_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        verbose_name='Entity ID'
    )
    description = models.TextField(
        blank=True,
        default='',
        verbose_name='Description'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP Address'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadata'
    )

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        # Prevent accidental modification
        permissions = [
            ('view_audit_logs', 'Can view audit logs'),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else 'System'
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {actor_name} - {self.get_action_display()}"

    @classmethod
    def log(cls, action, actor=None, entity_type='', entity_id='',
            description='', ip_address=None, metadata=None):
        """
        Convenience class method to create an audit log entry.
        """
        return cls.objects.create(
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else '',
            description=description,
            ip_address=ip_address,
            metadata=metadata or {},
        )
