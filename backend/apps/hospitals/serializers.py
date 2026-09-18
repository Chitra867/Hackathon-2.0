"""
Serializers for hospitals app.
"""

from rest_framework import serializers
from apps.hospitals.models import Hospital, Service, HospitalService, Availability


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model."""

    category_display = serializers.ReadOnlyField(source='get_category_display')

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'category', 'category_display',
            'description', 'is_active',
        ]


class ServiceMinimalSerializer(serializers.ModelSerializer):
    """Minimal service info for nested use."""

    class Meta:
        model = Service
        fields = ['id', 'name', 'category']


class HospitalServiceSerializer(serializers.ModelSerializer):
    """Serializer for HospitalService model."""

    service_detail = ServiceMinimalSerializer(
        source='service',
        read_only=True,
    )

    class Meta:
        model = HospitalService
        fields = [
            'id', 'hospital', 'service', 'service_detail',
            'is_available', 'notes',
        ]
        read_only_fields = ['id']


class AvailabilitySerializer(serializers.ModelSerializer):
    """Full availability serializer."""

    freshness_label = serializers.ReadOnlyField()
    age_minutes = serializers.ReadOnlyField()
    availability_type_display = serializers.ReadOnlyField(
        source='get_availability_type_display'
    )
    status_display = serializers.ReadOnlyField(source='get_status_display')
    service_detail = ServiceMinimalSerializer(
        source='service',
        read_only=True,
    )
    updated_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Availability
        fields = [
            'id', 'hospital', 'service', 'service_detail',
            'availability_type', 'availability_type_display',
            'status', 'status_display',
            'available_count', 'total_count', 'notes',
            'updated_at', 'updated_by', 'updated_by_username',
            'source', 'is_active',
            'freshness_label', 'age_minutes',
        ]
        read_only_fields = ['updated_at', 'updated_by', 'source']

    def get_updated_by_username(self, obj):
        if obj.updated_by:
            return obj.updated_by.username
        return None


class AvailabilityWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating/updating availability."""

    class Meta:
        model = Availability
        fields = [
            'hospital', 'service', 'availability_type',
            'status', 'available_count', 'total_count', 'notes', 'is_active',
        ]

    def validate(self, attrs):
        # Use existing values when a partial update omits either count.
        available_count = attrs.get(
            'available_count',
            getattr(self.instance, 'available_count', None),
        )
        total_count = attrs.get(
            'total_count',
            getattr(self.instance, 'total_count', None),
        )

        # Validate counts for every user, including system admins.
        if (
            available_count is not None
            and total_count is not None
            and available_count > total_count
        ):
            raise serializers.ValidationError({
                'available_count': (
                    'Available count cannot exceed total count.'
                )
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

        # Hospital staff/admin can only update their own hospital.
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
    """List serializer for Hospital model."""

    type_display = serializers.ReadOnlyField(source='get_type_display')
    verification_status_display = serializers.ReadOnlyField(
        source='get_verification_status_display'
    )
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'type', 'type_display',
            'address', 'district', 'municipality',
            'latitude', 'longitude',
            'phone', 'email', 'website', 'emergency_contact',
            'verification_status', 'verification_status_display',
            'is_active', 'created_at', 'services_count',
        ]
        read_only_fields = ['created_at']

    def get_services_count(self, obj):
        return obj.hospital_services.filter(is_available=True).count()


class HospitalDetailSerializer(serializers.ModelSerializer):
    """Detail serializer for Hospital with services and current availability."""

    type_display = serializers.ReadOnlyField(source='get_type_display')
    verification_status_display = serializers.ReadOnlyField(
        source='get_verification_status_display'
    )
    services = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'type', 'type_display',
            'address', 'district', 'municipality',
            'latitude', 'longitude',
            'phone', 'email', 'website', 'emergency_contact',
            'verification_status', 'verification_status_display',
            'is_active', 'created_at',
            'services', 'availability',
        ]

    def get_services(self, obj):
        qs = obj.hospital_services.filter(
            is_available=True
        ).select_related('service')
        return HospitalServiceSerializer(qs, many=True).data

    def get_availability(self, obj):
        qs = obj.availability_records.filter(
            is_active=True
        ).select_related('service', 'updated_by')
        return AvailabilitySerializer(qs, many=True).data


class HospitalWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating/updating hospitals."""

    class Meta:
        model = Hospital
        fields = [
            'name', 'type', 'address', 'district', 'municipality',
            'latitude', 'longitude',
            'phone', 'email', 'website', 'emergency_contact',
            'verification_status', 'is_active',
        ]

    def validate_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                'Hospital name must be at least 3 characters.'
            )
        return value.strip()