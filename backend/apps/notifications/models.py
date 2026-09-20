"""
Notification model for UpacharKhoj Nepal.

Stores per-user in-app notifications for:
  - Super Admin  : new referrals, patient requests, hospital activations
  - Hospital Admin: incoming referrals, patient requests, new services added
  - User         : referral/patient-request status updates
"""

from django.db import models


class Notification(models.Model):
    """
    A single in-app notification targeted at one user.
    """

    NOTIFICATION_TYPES = [
        # super-admin events
        ('new_referral',          'New Referral'),
        ('new_patient_request',   'New Patient Request'),
        # hospital-admin events
        ('referral_incoming',     'Incoming Referral'),
        ('patient_request_incoming', 'Incoming Patient Request'),
        ('new_service_added',     'New Service Added'),
        # user / health-worker events
        ('referral_status',       'Referral Status Update'),
        ('patient_request_status','Patient Request Status Update'),
        # generic
        ('info',                  'Information'),
    ]

    recipient = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Recipient',
    )
    notification_type = models.CharField(
        max_length=40,
        choices=NOTIFICATION_TYPES,
        verbose_name='Type',
    )
    title = models.CharField(max_length=255, verbose_name='Title')
    message = models.TextField(verbose_name='Message')
    is_read = models.BooleanField(default=False, verbose_name='Is Read')
    # optional link data so the frontend can deep-link
    link_url = models.CharField(
        max_length=300, blank=True, default='',
        verbose_name='Link URL',
    )
    # JSON-able extra data (referral id, status, etc.)
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Metadata')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.recipient.username}: {self.title}"

    # ----------------------------------------------------------
    # Factory helpers — call these from views/signals
    # ----------------------------------------------------------

    @classmethod
    def create_for_users(cls, recipients, notification_type, title, message,
                         link_url='', metadata=None):
        """
        Bulk-create one notification per recipient in `recipients`.
        Returns the list of created objects.
        """
        objs = [
            cls(
                recipient=r,
                notification_type=notification_type,
                title=title,
                message=message,
                link_url=link_url,
                metadata=metadata or {},
            )
            for r in recipients
        ]
        return cls.objects.bulk_create(objs)
