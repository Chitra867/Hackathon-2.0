"""
Serializers for hospitals app.
"""

from rest_framework import serializers

from apps.hospitals.models import (
    Hospital,
    Service,
    HospitalService,
    Availability,
    Doctor,
    PatientRequest,
    PatientRequestEvent,
)


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model."""

    category_display = serializers.ReadOnlyField(
        source='get_category_display'
    )

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'category',
            'category_display',
            'description',
            'is_active',
        ]


class ServiceMinimalSerializer(serializers.ModelSerializer):
    """Minimal service information for nested use."""

    class Meta:
        model = Service
        fields = [
            'id',
            'name',
            'category',
        ]


class HospitalServiceSerializer(serializers.ModelSerializer):
    """Serializer for services associated with a hospital."""

    service_detail = ServiceMinimalSerializer(
        source='service',
        read_only=True,
    )

    class Meta:
        model = HospitalService
        fields = [
            'id',
            'hospital',
            'service',
            'service_detail',
            'is_available',
            'notes',
        ]
        read_only_fields = ['id']


class AvailabilitySerializer(serializers.ModelSerializer):
    """Full availability serializer."""

    freshness_label = serializers.ReadOnlyField()
    age_minutes = serializers.ReadOnlyField()

    availability_type_display = serializers.ReadOnlyField(
        source='get_availability_type_display'
    )
    status_display = serializers.ReadOnlyField(
        source='get_status_display'
    )
    service_detail = ServiceMinimalSerializer(
        source='service',
        read_only=True,
    )
    updated_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Availability
        fields = [
            'id',
            'hospital',
            'service',
            'service_detail',
            'availability_type',
            'availability_type_display',
            'status',
            'status_display',
            'available_count',
            'total_count',
            'notes',
            'updated_at',
            'updated_by',
            'updated_by_username',
            'source',
            'is_active',
            'freshness_label',
            'age_minutes',
        ]
        read_only_fields = [
            'updated_at',
            'updated_by',
            'source',
        ]

    def get_updated_by_username(self, obj):
        if obj.updated_by:
            return obj.updated_by.username
        return None


class AvailabilityWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating and updating availability."""

    class Meta:
        model = Availability
        fields = [
            'hospital',
            'service',
            'availability_type',
            'status',
            'available_count',
            'total_count',
            'notes',
            'is_active',
        ]

    def validate(self, attrs):
        # Use existing values when PATCH omits either count.
        available_count = attrs.get(
            'available_count',
            getattr(self.instance, 'available_count', None),
        )
        total_count = attrs.get(
            'total_count',
            getattr(self.instance, 'total_count', None),
        )

        # Apply count validation to every user.
        if (
            available_count is not None
            and total_count is not None
            and available_count > total_count
        ):
            raise serializers.ValidationError({
                'available_count': (
                    'Available count cannot exceed total count.'
                ),
            })

        request = self.context.get('request')

        if not request:
            return attrs

        user = request.user
        hospital = attrs.get('hospital') or (
            self.instance.hospital if self.instance else None
        )

        # System admins can update any hospital.
        if user.role == 'system_admin':
            return attrs

        # Hospital staff/admins can only update their own hospital.
        if user.role in ('hospital_staff', 'hospital_admin'):
            if user.hospital is None:
                raise serializers.ValidationError(
                    'You are not associated with any hospital.'
                )

            if hospital and hospital.id != user.hospital_id:
                raise serializers.ValidationError(
                    'You can only update availability for your own hospital.'
                )

        return attrs

    def save(self, **kwargs):
        request = self.context.get('request')

        if request:
            kwargs['updated_by'] = request.user
            kwargs['source'] = 'manual'

        return super().save(**kwargs)


class BulkAvailabilitySerializer(serializers.Serializer):
    """Serializer for bulk availability updates."""

    updates = AvailabilityWriteSerializer(many=True)

    def validate_updates(self, value):
        if not value:
            raise serializers.ValidationError(
                'At least one update is required.'
            )

        if len(value) > 50:
            raise serializers.ValidationError(
                'Maximum 50 updates per request.'
            )

        return value


class HospitalSerializer(serializers.ModelSerializer):
    """List serializer for hospitals."""

    type_display = serializers.ReadOnlyField(
        source='get_type_display'
    )
    verification_status_display = serializers.ReadOnlyField(
        source='get_verification_status_display'
    )
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id',
            'name',
            'type',
            'type_display',
            'address',
            'district',
            'municipality',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'emergency_contact',
            'verification_status',
            'verification_status_display',
            'is_active',
            'created_at',
            'services_count',
        ]
        read_only_fields = ['created_at']

    def get_services_count(self, obj):
        return obj.hospital_services.filter(
            is_available=True
        ).count()


class HospitalDetailSerializer(serializers.ModelSerializer):
    """Hospital details, including services and active availability."""

    type_display = serializers.ReadOnlyField(
        source='get_type_display'
    )
    verification_status_display = serializers.ReadOnlyField(
        source='get_verification_status_display'
    )
    services = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id',
            'name',
            'type',
            'type_display',
            'address',
            'district',
            'municipality',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'emergency_contact',
            'verification_status',
            'verification_status_display',
            'is_active',
            'created_at',
            'services',
            'availability',
        ]

    def get_services(self, obj):
        queryset = obj.hospital_services.filter(
            is_available=True
        ).select_related('service')

        return HospitalServiceSerializer(
            queryset,
            many=True,
            context=self.context,
        ).data

    def get_availability(self, obj):
        queryset = obj.availability_records.filter(
            is_active=True
        ).select_related(
            'service',
            'updated_by',
        )

        return AvailabilitySerializer(
            queryset,
            many=True,
            context=self.context,
        ).data


class HospitalWriteSerializer(serializers.ModelSerializer):
    """Hospital creation and editing for system administrators."""

    class Meta:
        model = Hospital
        fields = [
            'name',
            'type',
            'address',
            'district',
            'municipality',
            'latitude',
            'longitude',
            'phone',
            'email',
            'website',
            'emergency_contact',
            'verification_status',
            'is_active',
        ]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                'Hospital name must be at least 3 characters.'
            )

        return value


class HospitalProfileWriteSerializer(serializers.ModelSerializer):
    """Restrict hospital-admin edits to contact and address fields."""

    class Meta:
        model = Hospital
        fields = [
            'address',
            'municipality',
            'phone',
            'emergency_contact',
            'email',
            'website',
        ]

    def to_internal_value(self, data):
        # Reject attempts to change fields such as verification_status,
        # is_active, name, or any other field outside this serializer.
        if hasattr(data, 'keys'):
            forbidden = set(data.keys()) - set(self.fields)

            if forbidden:
                raise serializers.ValidationError({
                    field: (
                        'This field cannot be edited through '
                        'your hospital profile.'
                    )
                    for field in forbidden
                })

        return super().to_internal_value(data)

    def validate_website(self, value):
        if value and not value.lower().startswith(('http://', 'https://')):
            raise serializers.ValidationError(
                'Use an http:// or https:// website URL.'
            )

        return value


# ─────────────────────────────────────────────────────────────
# Doctor Serializers
# ─────────────────────────────────────────────────────────────

class DoctorSerializer(serializers.ModelSerializer):
    """Read serializer for Doctor records."""

    duty_status_display = serializers.ReadOnlyField(source='get_duty_status_display')
    hospital_name = serializers.ReadOnlyField(source='hospital.name')

    class Meta:
        model = Doctor
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'name',
            'specialty',
            'qualification',
            'phone',
            'duty_status',
            'duty_status_display',
            'consultation_days',
            'consultation_time',
            'is_active',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class DoctorWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating/updating Doctor records (hospital admin)."""

    class Meta:
        model = Doctor
        fields = [
            'hospital',
            'name',
            'specialty',
            'qualification',
            'phone',
            'duty_status',
            'consultation_days',
            'consultation_time',
            'is_active',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        if not request:
            return attrs
        user = request.user
        hospital = attrs.get('hospital') or (self.instance.hospital if self.instance else None)
        if user.role in ('hospital_staff', 'hospital_admin'):
            if not user.hospital:
                raise serializers.ValidationError('You are not associated with any hospital.')
            if hospital and hospital.id != user.hospital_id:
                raise serializers.ValidationError(
                    'You can only manage doctors for your own hospital.'
                )
        return attrs

    def save(self, **kwargs):
        request = self.context.get('request')
        if request:
            kwargs['updated_by'] = request.user
        return super().save(**kwargs)


# ─────────────────────────────────────────────────────────────
# PatientRequest Serializers
# ─────────────────────────────────────────────────────────────

class PatientRequestEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientRequestEvent
        fields = ['id', 'actor', 'actor_name', 'old_status', 'new_status', 'note', 'created_at']

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return 'System'


class PatientRequestSerializer(serializers.ModelSerializer):
    """Read serializer for PatientRequest."""

    patient_name = serializers.SerializerMethodField()
    destination_hospital_name = serializers.ReadOnlyField(source='destination_hospital.name')
    destination_hospital_district = serializers.ReadOnlyField(source='destination_hospital.district')
    destination_hospital_is_active = serializers.ReadOnlyField(source='destination_hospital.is_active')
    service_name = serializers.SerializerMethodField()
    status_display = serializers.ReadOnlyField(source='get_status_display')
    events = PatientRequestEventSerializer(many=True, read_only=True)

    class Meta:
        model = PatientRequest
        fields = [
            'id',
            'request_code',
            'patient',
            'patient_name',
            'destination_hospital',
            'destination_hospital_name',
            'destination_hospital_district',
            'destination_hospital_is_active',
            'service',
            'service_name',
            'service_name_freetext',
            'contact_phone',
            'patient_age',
            'condition_summary',
            'notes',
            'status',
            'status_display',
            'response_note',
            'responded_by',
            'responded_at',
            'created_at',
            'updated_at',
            'events',
        ]
        read_only_fields = ['request_code', 'patient', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.get_full_name() or obj.patient.username

    def get_service_name(self, obj):
        if obj.service:
            return obj.service.name
        return obj.service_name_freetext or None


class PatientRequestCreateSerializer(serializers.ModelSerializer):
    """Create serializer for PatientRequest (patient submits)."""

    class Meta:
        model = PatientRequest
        fields = [
            'destination_hospital',
            'service',
            'service_name_freetext',
            'contact_phone',
            'patient_age',
            'condition_summary',
            'notes',
        ]

    def validate_destination_hospital(self, value):
        if not value.is_active or value.verification_status != 'verified':
            raise serializers.ValidationError(
                'That hospital is not currently accepting requests.'
            )
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        return PatientRequest.objects.create(
            patient=request.user,
            **validated_data
        )


class PatientRequestRespondSerializer(serializers.Serializer):
    """Hospital staff responds to a patient request."""

    STATUS_CHOICES = ['accepted', 'rejected', 'call_required']

    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True, default='')
