"""
Views for accounts app.
Handles authentication, registration, and user management.
"""

import logging
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User
from apps.accounts.serializers import (
    LoginSerializer,
    RegisterSerializer,
    ProfileSerializer,
    UserSerializer,
    UserCreateSerializer,
    ChangePasswordSerializer,
)
from apps.accounts.permissions import IsSystemAdmin, IsHospitalAdmin
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract the real IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class LoginView(APIView):
    """
    POST /api/auth/login
    Authenticate user and return JWT tokens + user info.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Audit log
        AuditLog.log(
            action='login',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"User '{user.username}' logged in.",
            ip_address=get_client_ip(request),
        )

        profile_serializer = ProfileSerializer(user, context={'request': request})

        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': profile_serializer.data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout
    Blacklist the refresh token to invalidate the session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            AuditLog.log(
                action='logout',
                actor=request.user,
                entity_type='User',
                entity_id=request.user.id,
                description=f"User '{request.user.username}' logged out.",
                ip_address=get_client_ip(request),
            )

            return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)

        except TokenError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Public self-registration for a normal UpacharKhoj user account.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        AuditLog.log(
            action='register',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"User '{user.username}' created a public user account.",
            ip_address=get_client_ip(request),
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': ProfileSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile - Get current user's profile.
    PATCH /api/auth/profile - Update current user's profile.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        AuditLog.log(
            action='update',
            actor=self.request.user,
            entity_type='User',
            entity_id=self.request.user.id,
            description=f"User '{self.request.user.username}' updated their profile.",
            ip_address=get_client_ip(self.request),
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password
    Change the authenticated user's password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Incorrect current password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        AuditLog.log(
            action='password_change',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"User '{user.username}' changed their password.",
            ip_address=get_client_ip(request),
        )

        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Send a password reset link to the user's email.
    Request body: { "email": "user@example.com" }
    Always returns 200 to prevent email enumeration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            # Return 200 anyway to prevent email enumeration
            return Response(
                {'detail': 'If an account with that email exists, a reset link has been sent.'},
                status=status.HTTP_200_OK
            )

        # Generate token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"

        # Send email (console backend in dev)
        try:
            send_mail(
                subject='UpacharKhoj — Reset Your Password',
                message=(
                    f"Hello {user.first_name or user.username},\n\n"
                    f"You requested a password reset for your UpacharKhoj account.\n\n"
                    f"Click the link below to reset your password (valid for 1 hour):\n"
                    f"{reset_link}\n\n"
                    f"If you did not request this, you can safely ignore this email.\n\n"
                    f"— UpacharKhoj Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Password reset email failed for {user.email}: {e}")

        AuditLog.log(
            action='password_reset_request',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"Password reset requested for '{user.username}'.",
            ip_address=get_client_ip(request),
        )

        return Response(
            {'detail': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK
        )


class ResetPasswordConfirmView(APIView):
    """
    POST /api/auth/reset-password-confirm/
    Confirm password reset using uid + token from email link.
    Request body: { "uid": "...", "token": "...", "new_password": "...", "new_password2": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid', '')
        token = request.data.get('token', '')
        new_password = request.data.get('new_password', '')
        new_password2 = request.data.get('new_password2', '')

        if not uid or not token or not new_password:
            return Response(
                {'detail': 'uid, token and new_password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password2:
            return Response(
                {'new_password': 'Passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {'detail': 'Invalid reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Reset link has expired or is invalid. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({'new_password': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        AuditLog.log(
            action='password_reset_confirm',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"Password reset completed for '{user.username}'.",
            ip_address=get_client_ip(request),
        )

        return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


class PatientSearchView(APIView):
    """
    GET /api/auth/patients/search/?q=<name_or_phone>
    Hospital admins can list/search registered patients (role='user').
    Returns only safe, non-sensitive fields.
    - No q param → returns all active patients (up to 200), ordered by name.
    - q param (≥2 chars) → filters by name, username, email, or phone.
    """
    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    def get(self, request):
        from django.db.models import Q
        q = request.query_params.get('q', '').strip()

        qs = User.objects.filter(role='user', is_active=True).order_by('first_name', 'last_name')

        if q:
            if len(q) < 2:
                return Response([], status=status.HTTP_200_OK)
            qs = qs.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(phone__icontains=q)
            )

        qs = qs[:200]

        data = [
            {
                'id': u.id,
                'full_name': u.full_name,
                'username': u.username,
                'phone': u.phone,
                'email': u.email,
            }
            for u in qs
        ]
        return Response(data, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for users.
    GET /api/users/
    POST /api/users/
    GET /api/users/{id}/
    PATCH /api/users/{id}/
    DELETE /api/users/{id}/
    """
    queryset = User.objects.all().select_related('hospital').order_by('-date_joined')
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.log(
            action='user_create',
            actor=self.request.user,
            entity_type='User',
            entity_id=user.id,
            description=f"Admin '{self.request.user.username}' created user '{user.username}'.",
            ip_address=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        user = serializer.save()
        AuditLog.log(
            action='user_update',
            actor=self.request.user,
            entity_type='User',
            entity_id=user.id,
            description=f"Admin '{self.request.user.username}' updated user '{user.username}'.",
            ip_address=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        username = instance.username
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        AuditLog.log(
            action='delete',
            actor=self.request.user,
            entity_type='User',
            entity_id=instance.id,
            description=f"Admin '{self.request.user.username}' deactivated user '{username}'.",
            ip_address=get_client_ip(self.request),
        )
