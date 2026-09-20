"""
Serializers for accounts app.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.accounts.models import User


class HospitalMinimalSerializer(serializers.Serializer):
    """Minimal hospital info for user serialization."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    district = serializers.CharField()
    is_active = serializers.BooleanField()


class UserSerializer(serializers.ModelSerializer):
    """Full user serializer for admin use."""

    hospital_detail = HospitalMinimalSerializer(source='hospital', read_only=True)
    hospital_name = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'hospital', 'hospital_name',
            'hospital_detail', 'phone', 'is_verified', 'is_active',
            'date_joined', 'last_login',
        ]
        read_only_fields = ['date_joined', 'last_login']

    def get_hospital_name(self, obj):
        return obj.hospital.name if obj.hospital else None


class UserPublicSerializer(serializers.ModelSerializer):
    """Public-safe user serializer (no sensitive data)."""

    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'role_display']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for normal public user self-registration."""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='Confirm Password',
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password2', 'phone',
        ]

    def validate_username(self, value):
        return value.strip()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return email

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')

        if password != password2:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.'
            })

        # Give Django's password validators the user's registration fields so
        # similarity checks can compare against username/name/email.
        prospective_user = User(
            username=attrs.get('username', ''),
            email=attrs.get('email', ''),
            first_name=attrs.get('first_name', ''),
            last_name=attrs.get('last_name', ''),
            role='user',
        )

        try:
            validate_password(password, user=prospective_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})

        attrs.pop('password2')
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(
            password=password,
            role='user',
            is_verified=True,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    The `username` input accepts either a username or an email address.
    """

    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        identifier = attrs.get('username', '').strip()
        password = attrs.get('password')

        # First try the value as a username.
        user = authenticate(
            request=self.context.get('request'),
            username=identifier,
            password=password,
        )

        # If that fails, allow the same field to be an email address.
        if not user:
            email_user = User.objects.filter(email__iexact=identifier).first()
            if email_user:
                user = authenticate(
                    request=self.context.get('request'),
                    username=email_user.username,
                    password=password,
                )

        if not user:
            raise serializers.ValidationError('Invalid username/email or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        if not user.is_verified:
            raise serializers.ValidationError('Account not yet verified.')

        attrs['user'] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing/updating the authenticated user's profile."""

    hospital_detail = HospitalMinimalSerializer(source='hospital', read_only=True)
    hospital_name = serializers.SerializerMethodField()
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'hospital', 'hospital_name',
            'hospital_detail', 'phone', 'is_verified', 'is_active',
            'date_joined', 'last_login',
        ]
        read_only_fields = [
            'username', 'role', 'is_verified', 'is_active',
            'date_joined', 'last_login',
        ]

    def get_hospital_name(self, obj):
        return obj.hospital.name if obj.hospital else None


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        label='Confirm New Password',
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                'new_password': 'Passwords do not match.'
            })

        try:
            validate_password(attrs['new_password'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'new_password': list(exc.messages)})

        return attrs


class UserCreateSerializer(serializers.ModelSerializer):
    """Admin-only serializer for creating users with any allowed role."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    hospital = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        read_only=True
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'role', 'hospital', 'phone', 'is_verified', 'is_active',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.hospitals.models import Hospital
        self.fields['hospital'] = serializers.PrimaryKeyRelatedField(
            required=False,
            allow_null=True,
            queryset=Hospital.objects.all()
        )

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)
