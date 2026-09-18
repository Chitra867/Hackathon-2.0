"""
Referral models for UpacharKhoj Nepal.
Handles patient referrals between healthcare facilities.
"""

import uuid
from django.db import models


def generate_referral_code():
    """Generate a short unique referral code."""
    return uuid.uuid4().hex[:10].upper()


class Referral(models.Model):
    """
    A patient referral from one healthcare facility to another.
    Contains minimal patient info to protect privacy while enabling coordination.
    """

    URGENCY_CHOICES = [
        ('emergency', 'Emergency'),
        ('urgent', 'Urgent'),
        ('routine', 'Routine'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('call_required', 'Call Required'),
        ('patient_sent', 'Patient Sent'),
        ('patient_arrived', 'Patient Arrived'),
        ('cancelled', 'Cancelled'),
    ]

    GENDER_CHOICES = [
        ('m', 'Male'),
        ('f', 'Female'),
        ('other', 'Other'),
    ]

    referral_code = models.CharField(
        max_length=10,
        unique=True,
        default=generate_referral_code,
        editable=False,
        verbose_name='Referral Code'
    )
    referring_facility = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.PROTECT,
        related_name='outgoing_referrals',
        verbose_name='Referring Facility'
    )
    destination_facility = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.PROTECT,
        related_name='incoming_referrals',
        verbose_name='Destination Facility'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='created_referrals',
        verbose_name='Created By'
    )
    service = models.ForeignKey(
        'hospitals.Service',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referrals',
        verbose_name='Service Requested'
    )
    urgency = models.CharField(
        max_length=10,
        choices=URGENCY_CHOICES,
        default='routine',
        verbose_name='Urgency'
    )
    patient_age = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Patient Age'
    )
    patient_gender = models.CharField(
        max_length=5,
        choices=GENDER_CHOICES,
        blank=True,
        default='',
        verbose_name='Patient Gender'
    )
    patient_condition_summary = models.CharField(
        max_length=500,
        verbose_name='Patient Condition Summary'
    )
    reason = models.TextField(
        blank=True,
        default='',
        verbose_name='Reason for Referral'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Responded At'
    )
    responded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responded_referrals',
        verbose_name='Responded By'
    )

    class Meta:
        verbose_name = 'Referral'
        verbose_name_plural = 'Referrals'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"[{self.referral_code}] {self.referring_facility.name} → "
            f"{self.destination_facility.name} ({self.get_status_display()})"
        )


class ReferralEvent(models.Model):
    """
    Audit trail for all status changes on a referral.
    """

    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='Referral'
    )
    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='referral_events',
        verbose_name='Actor'
    )
    old_status = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='Old Status'
    )
    new_status = models.CharField(
        max_length=20,
        verbose_name='New Status'
    )
    note = models.TextField(
        blank=True,
        default='',
        verbose_name='Note'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        verbose_name = 'Referral Event'
        verbose_name_plural = 'Referral Events'
        ordering = ['created_at']

    def __str__(self):
        return (
            f"[{self.referral.referral_code}] "
            f"{self.old_status or 'new'} → {self.new_status}"
        )
