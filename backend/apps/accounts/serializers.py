"""
Serializers for accounts app.
"""

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User


class HospitalMinimalSerializer(serializers.Serializer):
    """Minimal hospital info for user serialization (avoid circular import)."""
    id = serializers.IntegerField()
    name = serializers.CharField()
    district = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    """Full user serializer for admin use."""
    hospital_detail = HospitalMinimalSerializer(source='hospital', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'hospital', 'hospital_detail',
            'phone', 'is_verified', 'is_active', 'date_joined', 'last_login',
        ]
        read_only_fields = ['date_joined', 'last_login']


class UserPublicSerializer(serializers.ModelSerializer):
    """Public-safe user serializer (no sensitive data)."""
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for health worker self-registration.
    """
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
    hospital = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        read_only=True  # queryset is set dynamically in __init__
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password2', 'phone', 'hospital',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.hospitals.models import Hospital
        self.fields['hospital'] = serializers.PrimaryKeyRelatedField(
            required=False,
            allow_null=True,
            queryset=Hospital.objects.filter(is_active=True)
        )

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.role = 'patient'
        user.is_verified = True
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login. Returns JWT tokens and user info.
    """
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(
            request=self.context.get('request'),
            username=username,
            password=password
        )

        if not user:
            raise serializers.ValidationError('Invalid username or password.')

        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        if not user.is_verified:
            raise serializers.ValidationError('Account not yet verified.')

        attrs['user'] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing/updating the authenticated user's profile."""
    hospital_detail = HospitalMinimalSerializer(source='hospital', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'hospital', 'hospital_detail',
            'phone', 'is_verified', 'date_joined', 'last_login',
        ]
        read_only_fields = ['username', 'role', 'is_verified', 'date_joined', 'last_login']


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
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        validate_password(attrs['new_password'])
        return attrs


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Admin-only serializer for creating users with any role.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    hospital = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        read_only=True  # queryset is set dynamically in __init__
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
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
