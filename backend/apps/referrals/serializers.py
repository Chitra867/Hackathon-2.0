"""
Serializers for referrals app.
Note: Public endpoints must NOT expose patient data.
"""

from rest_framework import serializers
from apps.referrals.models import Referral, ReferralEvent


class HospitalRefSerializer(serializers.Serializer):
    """Minimal hospital reference for referral serialization."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    district = serializers.CharField()
    phone = serializers.CharField()
    emergency_contact = serializers.CharField()


class UserRefSerializer(serializers.Serializer):
    """Minimal user reference for referral serialization."""
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class ServiceRefSerializer(serializers.Serializer):
    """Minimal service reference for referral serialization."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    category = serializers.CharField()


class ReferralEventSerializer(serializers.ModelSerializer):
    """Serializer for referral events/history."""
    actor_detail = UserRefSerializer(source='actor', read_only=True)

    class Meta:
        model = ReferralEvent
        fields = [
            'id', 'old_status', 'new_status', 'note',
            'actor', 'actor_detail', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ReferralCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for health workers creating a referral.
    """
    referring_facility = serializers.PrimaryKeyRelatedField(read_only=True)
    destination_facility = serializers.PrimaryKeyRelatedField(read_only=True)
    service = serializers.PrimaryKeyRelatedField(read_only=True, required=False, allow_null=True)

    class Meta:
        model = Referral
        fields = [
            'referring_facility', 'destination_facility', 'service',
            'urgency', 'patient_age', 'patient_gender',
            'patient_condition_summary', 'reason',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.hospitals.models import Hospital, Service
        self.fields['referring_facility'] = serializers.PrimaryKeyRelatedField(
            queryset=Hospital.objects.filter(is_active=True)
        )
        self.fields['destination_facility'] = serializers.PrimaryKeyRelatedField(
            queryset=Hospital.objects.filter(is_active=True)
        )
        self.fields['service'] = serializers.PrimaryKeyRelatedField(
            queryset=Service.objects.filter(is_active=True),
            required=False,
            allow_null=True
        )

    def validate(self, attrs):
        if attrs.get('referring_facility') == attrs.get('destination_facility'):
            raise serializers.ValidationError(
                'Referring and destination facilities cannot be the same.'
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        referral = Referral.objects.create(**validated_data)
        # Create initial event
        ReferralEvent.objects.create(
            referral=referral,
            actor=request.user,
            old_status='',
            new_status='pending',
            note='Referral created.',
        )
        return referral


class ReferralListSerializer(serializers.ModelSerializer):
    """
    List serializer. Exposes minimal patient data to authorized users.
    """
    referring_facility_detail = HospitalRefSerializer(
        source='referring_facility', read_only=True
    )
    destination_facility_detail = HospitalRefSerializer(
        source='destination_facility', read_only=True
    )
    service_detail = ServiceRefSerializer(source='service', read_only=True)
    created_by_detail = UserRefSerializer(source='created_by', read_only=True)
    urgency_display = serializers.ReadOnlyField(source='get_urgency_display')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = Referral
        fields = [
            'id', 'referral_code',
            'referring_facility', 'referring_facility_detail',
            'destination_facility', 'destination_facility_detail',
            'service', 'service_detail',
            'urgency', 'urgency_display',
            'patient_age', 'patient_gender',
            'patient_condition_summary',
            'status', 'status_display',
            'created_at', 'updated_at', 'responded_at',
            'created_by', 'created_by_detail',
        ]


class ReferralDetailSerializer(serializers.ModelSerializer):
    """
    Full referral detail including event history.
    Only accessible to involved parties.
    """
    referring_facility_detail = HospitalRefSerializer(
        source='referring_facility', read_only=True
    )
    destination_facility_detail = HospitalRefSerializer(
        source='destination_facility', read_only=True
    )
    service_detail = ServiceRefSerializer(source='service', read_only=True)
    created_by_detail = UserRefSerializer(source='created_by', read_only=True)
    responded_by_detail = UserRefSerializer(source='responded_by', read_only=True)
    events = ReferralEventSerializer(many=True, read_only=True)
    urgency_display = serializers.ReadOnlyField(source='get_urgency_display')
    status_display = serializers.ReadOnlyField(source='get_status_display')
    gender_display = serializers.ReadOnlyField(source='get_patient_gender_display')

    class Meta:
        model = Referral
        fields = [
            'id', 'referral_code',
            'referring_facility', 'referring_facility_detail',
            'destination_facility', 'destination_facility_detail',
            'service', 'service_detail',
            'urgency', 'urgency_display',
            'patient_age', 'patient_gender', 'gender_display',
            'patient_condition_summary', 'reason',
            'status', 'status_display',
            'created_at', 'updated_at', 'responded_at',
            'created_by', 'created_by_detail',
            'responded_by', 'responded_by_detail',
            'events',
        ]


class ReferralRespondSerializer(serializers.Serializer):
    """
    Serializer for hospital staff responding to a referral.
    """
    RESPONSE_STATUSES = [
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('call_required', 'Call Required'),
    ]

    status = serializers.ChoiceField(choices=RESPONSE_STATUSES)
    note = serializers.CharField(required=False, allow_blank=True, default='')


class ReferralUpdateStatusSerializer(serializers.Serializer):
    """
    Serializer for health worker updating referral status (patient sent/arrived).
    """
    UPDATE_STATUSES = [
        ('patient_sent', 'Patient Sent'),
        ('patient_arrived', 'Patient Arrived'),
        ('cancelled', 'Cancelled'),
    ]

    status = serializers.ChoiceField(choices=UPDATE_STATUSES)
    note = serializers.CharField(required=False, allow_blank=True, default='')
