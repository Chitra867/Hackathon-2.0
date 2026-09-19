"""
Hospital, Service, and Availability models for UpacharKhoj Nepal.
"""

from django.db import models
from django.utils import timezone


class Hospital(models.Model):
    """
    Represents a healthcare facility in Nepal.
    Includes location, contact, and verification details.
    """

    HOSPITAL_TYPES = [
        ('district', 'District Hospital'),
        ('private', 'Private Hospital'),
        ('community', 'Community Hospital'),
        ('teaching', 'Teaching Hospital'),
        ('clinic', 'Clinic/Health Post'),
    ]

    VERIFICATION_STATUS = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]

    name = models.CharField(max_length=255, verbose_name='Hospital Name')
    type = models.CharField(
        max_length=20,
        choices=HOSPITAL_TYPES,
        default='district',
        verbose_name='Hospital Type'
    )
    address = models.TextField(verbose_name='Address')
    district = models.CharField(max_length=100, verbose_name='District')
    municipality = models.CharField(max_length=100, blank=True, default='', verbose_name='Municipality')
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7,
        null=True, blank=True,
        verbose_name='Latitude'
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7,
        null=True, blank=True,
        verbose_name='Longitude'
    )
    phone = models.CharField(max_length=30, blank=True, default='', verbose_name='Phone')
    email = models.EmailField(blank=True, default='', verbose_name='Email')
    website = models.URLField(blank=True, default='', verbose_name='Website')
    emergency_contact = models.CharField(
        max_length=30, blank=True, default='',
        verbose_name='Emergency Contact'
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS,
        default='pending',
        verbose_name='Verification Status'
    )
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitals'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.district})"


class Service(models.Model):
    """
    A medical service category that hospitals can offer.
    """

    CATEGORIES = [
        ('icu', 'Intensive Care Unit (ICU)'),
        ('nicu', 'Neonatal ICU (NICU)'),
        ('ct', 'CT Scan'),
        ('mri', 'MRI'),
        ('dialysis', 'Dialysis'),
        ('cardiology', 'Cardiology'),
        ('maternity', 'Maternity / Obstetrics'),
        ('bloodbank', 'Blood Bank'),
        ('surgery', 'Emergency Surgery'),
        ('emergency', 'Emergency Department'),
        ('orthopedics', 'Orthopedics'),
        ('neurology', 'Neurology'),
        ('pediatrics', 'Pediatrics'),
        ('ophthalmology', 'Ophthalmology'),
        ('ent', 'ENT'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=150, verbose_name='Service Name')
    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        default='other',
        verbose_name='Category'
    )
    description = models.TextField(blank=True, default='', verbose_name='Description')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class HospitalService(models.Model):
    """
    Many-to-many relationship between hospitals and services they provide.
    """

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='hospital_services',
        verbose_name='Hospital'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='hospital_services',
        verbose_name='Service'
    )
    is_available = models.BooleanField(default=True, verbose_name='Is Available')
    notes = models.TextField(blank=True, default='', verbose_name='Notes')

    class Meta:
        verbose_name = 'Hospital Service'
        verbose_name_plural = 'Hospital Services'
        unique_together = ('hospital', 'service')
        ordering = ['hospital', 'service']

    def __str__(self):
        status = 'Available' if self.is_available else 'Unavailable'
        return f"{self.hospital.name} - {self.service.name} ({status})"


class Availability(models.Model):
    """
    Real-time availability record for a hospital resource.
    Tracks beds, ICU, NICU, specialists, equipment, blood, etc.
    """

    AVAILABILITY_TYPES = [
        ('bed', 'General Bed'),
        ('icu', 'ICU Bed'),
        ('nicu', 'NICU Bed'),
        ('specialist', 'Specialist'),
        ('test', 'Diagnostic Test'),
        ('equipment', 'Equipment'),
        ('blood', 'Blood'),
        ('emergency', 'Emergency'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('limited', 'Limited'),
        ('unavailable', 'Unavailable'),
        ('full', 'Full'),
        ('unknown', 'Unknown'),
    ]

    SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('api', 'API/Integration'),
        ('auto', 'Automated'),
    ]

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='availability_records',
        verbose_name='Hospital'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='availability_records',
        verbose_name='Service'
    )
    availability_type = models.CharField(
        max_length=20,
        choices=AVAILABILITY_TYPES,
        verbose_name='Availability Type'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='unknown',
        verbose_name='Status'
    )
    available_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Available Count'
    )
    total_count = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Total Count'
    )
    notes = models.TextField(blank=True, default='', verbose_name='Notes')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Last Updated')
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='availability_updates',
        verbose_name='Updated By'
    )
    source = models.CharField(
        max_length=10,
        choices=SOURCE_CHOICES,
        default='manual',
        verbose_name='Data Source'
    )
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        verbose_name = 'Availability'
        verbose_name_plural = 'Availability Records'
        ordering = ['-updated_at']
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(available_count__isnull=True)
                    | models.Q(total_count__isnull=True)
                    | models.Q(
                        available_count__lte=models.F('total_count')
                    )
                ),
                name='availability_count_lte_total',
            ),
        ]

    def __str__(self):
        return (
            f"{self.hospital.name} - {self.get_availability_type_display()} "
            f"({self.get_status_display()})"
        )

    @property
    def freshness_label(self):
        """
        Returns a label indicating how fresh this availability data is.
        <30min = current, 30min-2hr = recent, 2-6hr = old, >6hr = stale
        """
        now = timezone.now()
        age = now - self.updated_at
        total_minutes = age.total_seconds() / 60

        if total_minutes < 30:
            return 'current'
        elif total_minutes < 120:
            return 'recent'
        elif total_minutes < 360:
            return 'old'
        else:
            return 'stale'

    @property
    def age_minutes(self):
        """Returns age of the record in minutes."""
        now = timezone.now()
        age = now - self.updated_at
        return int(age.total_seconds() / 60)


class Doctor(models.Model):
    """
    A doctor or specialist associated with a hospital.
    Hospital admins maintain this information.
    """

    DUTY_STATUS = [
        ('on_duty', 'On Duty'),
        ('off_duty', 'Off Duty'),
        ('on_leave', 'On Leave'),
        ('unknown', 'Unknown'),
    ]

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='doctors',
        verbose_name='Hospital'
    )
    name = models.CharField(max_length=200, verbose_name='Doctor Name')
    specialty = models.CharField(max_length=200, verbose_name='Specialty')
    qualification = models.CharField(
        max_length=300, blank=True, default='',
        verbose_name='Qualification'
    )
    phone = models.CharField(
        max_length=30, blank=True, default='',
        verbose_name='Contact Phone'
    )
    duty_status = models.CharField(
        max_length=20,
        choices=DUTY_STATUS,
        default='unknown',
        verbose_name='Duty Status'
    )
    consultation_days = models.CharField(
        max_length=200, blank=True, default='',
        verbose_name='Consultation Days',
        help_text='E.g. "Mon, Wed, Fri" or "Mon–Fri"'
    )
    consultation_time = models.CharField(
        max_length=100, blank=True, default='',
        verbose_name='Consultation Time',
        help_text='E.g. "9:00 AM – 1:00 PM"'
    )
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Last Updated')
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='doctor_updates',
        verbose_name='Updated By'
    )

    class Meta:
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'
        ordering = ['hospital', 'name']

    def __str__(self):
        return f"Dr. {self.name} ({self.specialty}) — {self.hospital.name}"


class PatientRequest(models.Model):
    """
    A patient-initiated assistance request to a hospital.
    Distinct from the institutional Referral which requires a health worker.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('call_required', 'Call Required'),
        ('cancelled', 'Cancelled'),
    ]

    import uuid as _uuid

    request_code = models.CharField(
        max_length=12,
        unique=True,
        editable=False,
        verbose_name='Request Code'
    )
    patient = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='patient_requests',
        verbose_name='Patient'
    )
    destination_hospital = models.ForeignKey(
        Hospital,
        on_delete=models.PROTECT,
        related_name='patient_requests',
        verbose_name='Destination Hospital'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patient_requests',
        verbose_name='Requested Service'
    )
    service_name_freetext = models.CharField(
        max_length=300, blank=True, default='',
        verbose_name='Service (free text)'
    )
    contact_phone = models.CharField(
        max_length=30, blank=True, default='',
        verbose_name='Contact Phone'
    )
    patient_age = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name='Patient Age'
    )
    condition_summary = models.CharField(
        max_length=500,
        verbose_name='Condition Summary'
    )
    notes = models.TextField(
        blank=True, default='',
        verbose_name='Additional Notes'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )
    response_note = models.TextField(
        blank=True, default='',
        verbose_name='Hospital Response Note'
    )
    responded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='responded_patient_requests',
        verbose_name='Responded By'
    )
    responded_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Responded At'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        verbose_name = 'Patient Request'
        verbose_name_plural = 'Patient Requests'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.request_code:
            import uuid
            self.request_code = uuid.uuid4().hex[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"[{self.request_code}] {self.patient.username} → "
            f"{self.destination_hospital.name} ({self.get_status_display()})"
        )


class PatientRequestEvent(models.Model):
    """Audit trail for status changes on a patient request."""

    request = models.ForeignKey(
        PatientRequest,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='Patient Request'
    )
    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='patient_request_events',
        verbose_name='Actor'
    )
    old_status = models.CharField(max_length=20, blank=True, default='', verbose_name='Old Status')
    new_status = models.CharField(max_length=20, verbose_name='New Status')
    note = models.TextField(blank=True, default='', verbose_name='Note')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        verbose_name = 'Patient Request Event'
        verbose_name_plural = 'Patient Request Events'
        ordering = ['created_at']

    def __str__(self):
        return (
            f"[{self.request.request_code}] "
            f"{self.old_status or 'new'} → {self.new_status}"
        )
