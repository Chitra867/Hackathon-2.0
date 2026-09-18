"""
Views for accounts app.
Handles authentication, registration, and user management.
"""

import logging
from django.utils import timezone
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
from apps.accounts.permissions import IsSystemAdmin
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
    POST /api/auth/register
    Self-registration for health workers.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.log(
            action='register',
            actor=user,
            entity_type='User',
            entity_id=user.id,
            description=f"Health worker '{user.username}' self-registered.",
            ip_address=get_client_ip(self.request),
        )

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(username=response.data['username'])
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
