"""
Views for referrals app.
Handles patient referral creation and status management.
"""

import logging
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.referrals.models import Referral, ReferralEvent
from apps.referrals.serializers import (
    ReferralCreateSerializer,
    ReferralListSerializer,
    ReferralDetailSerializer,
    ReferralRespondSerializer,
    ReferralUpdateStatusSerializer,
)
from apps.accounts.permissions import IsHealthWorker, IsHospitalStaff


class IsHospitalStaffOrHealthWorker(IsHealthWorker):
    """Allow health_worker OR hospital_admin/hospital_staff/system_admin to create referrals."""
    message = 'Health worker or hospital admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('health_worker', 'hospital_admin', 'hospital_staff', 'system_admin')
        )
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract the real IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class ReferralViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patient referrals.

    - POST /api/referrals/ - health_worker creates referral
    - GET /api/referrals/ - filtered by role
    - GET /api/referrals/{id}/ - detail view
    - PATCH /api/referrals/{id}/respond/ - hospital_staff responds
    - PATCH /api/referrals/{id}/update_status/ - health_worker updates patient status
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'urgency', 'referring_facility', 'destination_facility']
    search_fields = ['referral_code', 'patient_condition_summary']
    ordering_fields = ['created_at', 'urgency', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user

        base_qs = Referral.objects.select_related(
            'referring_facility', 'destination_facility',
            'created_by', 'responded_by', 'service',
        ).prefetch_related('events__actor')

        if user.role == 'system_admin':
            return base_qs.all()

        if user.role == 'health_worker':
            # Health workers see only their own referrals
            return base_qs.filter(created_by=user)

        if user.role in ('hospital_staff', 'hospital_admin'):
            if user.hospital:
                from django.db.models import Q
                # hospital_admin sees BOTH incoming AND outgoing referrals for their hospital
                # hospital_staff sees only incoming
                if user.role == 'hospital_admin':
                    return base_qs.filter(
                        Q(destination_facility=user.hospital) |
                        Q(referring_facility=user.hospital)
                    ).distinct()
                else:
                    return base_qs.filter(destination_facility=user.hospital)
            return base_qs.none()

        return base_qs.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return ReferralCreateSerializer
        if self.action == 'retrieve':
            return ReferralDetailSerializer
        if self.action == 'respond':
            return ReferralRespondSerializer
        if self.action == 'update_status':
            return ReferralUpdateStatusSerializer
        return ReferralListSerializer

    def get_permissions(self):
        if self.action == 'create':
            # health_worker AND hospital_admin can create referrals
            return [IsAuthenticated(), IsHospitalStaffOrHealthWorker()]
        if self.action == 'respond':
            # hospital_staff, hospital_admin, system_admin can respond
            return [IsAuthenticated(), IsHospitalStaff()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        referral = serializer.save()

        AuditLog.log(
            action='referral_create',
            actor=request.user,
            entity_type='Referral',
            entity_id=referral.id,
            description=(
                f"Referral [{referral.referral_code}] created by '{request.user.username}': "
                f"{referral.referring_facility.name} → {referral.destination_facility.name}"
            ),
            ip_address=get_client_ip(request),
            metadata={
                'referral_code': referral.referral_code,
                'urgency': referral.urgency,
                'destination': referral.destination_facility.name,
            }
        )

        # ── Notifications ──────────────────────────────────────
        try:
            from apps.notifications.models import Notification
            from apps.accounts.models import User as UserModel

            # 1. Notify all super-admins about every new referral
            super_admins = list(UserModel.objects.filter(role='system_admin', is_active=True))
            Notification.create_for_users(
                recipients=super_admins,
                notification_type='new_referral',
                title='New Referral Created',
                message=(
                    f"Referral [{referral.referral_code}] from "
                    f"{referral.referring_facility.name} to "
                    f"{referral.destination_facility.name}. "
                    f"Urgency: {referral.get_urgency_display()}."
                ),
                link_url='/admin/patient-requests',
                metadata={
                    'referral_id': referral.id,
                    'referral_code': referral.referral_code,
                    'urgency': referral.urgency,
                },
            )

            # 2. Notify hospital-admin(s) of the destination facility
            dest_admins = list(
                UserModel.objects.filter(
                    role__in=['hospital_admin', 'hospital_staff'],
                    hospital=referral.destination_facility,
                    is_active=True,
                )
            )
            Notification.create_for_users(
                recipients=dest_admins,
                notification_type='referral_incoming',
                title='Incoming Referral',
                message=(
                    f"New referral [{referral.referral_code}] received from "
                    f"{referral.referring_facility.name}. "
                    f"Urgency: {referral.get_urgency_display()}."
                ),
                link_url='/hadmin/referrals',
                metadata={
                    'referral_id': referral.id,
                    'referral_code': referral.referral_code,
                    'urgency': referral.urgency,
                },
            )
        except Exception as notif_err:
            logger.warning("Failed to create referral notifications: %s", notif_err)
        # ── End Notifications ──────────────────────────────────

        return Response(
            ReferralListSerializer(referral, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def _check_referral_access(self, user, referral):
        """Raise 403 if user has no right to view this referral."""
        if user.role == 'system_admin':
            return
        if user.role == 'health_worker' and referral.created_by == user:
            return
        if user.role in ('hospital_staff', 'hospital_admin'):
            if user.hospital and (
                referral.destination_facility_id == user.hospital_id
                or referral.referring_facility_id == user.hospital_id
            ):
                return
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied('You do not have permission to view this referral.')

    def retrieve(self, request, *args, **kwargs):
        """Detail view — verify the user has access."""
        instance = self.get_object()
        self._check_referral_access(request.user, instance)
        serializer = ReferralDetailSerializer(instance, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='respond')
    def respond(self, request, pk=None):
        """
        PATCH /api/referrals/{id}/respond/
        Hospital staff accepts, rejects, or marks call_required.
        """
        referral = self.get_object()

        # Verify it's incoming to this hospital
        if (
            request.user.role in ('hospital_staff', 'hospital_admin')
            and request.user.hospital
            and referral.destination_facility_id != request.user.hospital_id
        ):
            return Response(
                {'error': 'This referral is not directed to your hospital.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only pending referrals can be responded to
        if referral.status not in ('pending', 'call_required'):
            return Response(
                {'error': f"Cannot respond to a referral with status '{referral.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReferralRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = referral.status
        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        referral.status = new_status
        referral.responded_at = timezone.now()
        referral.responded_by = request.user
        referral.save(update_fields=['status', 'responded_at', 'responded_by', 'updated_at'])

        ReferralEvent.objects.create(
            referral=referral,
            actor=request.user,
            old_status=old_status,
            new_status=new_status,
            note=note,
        )

        AuditLog.log(
            action='referral_response',
            actor=request.user,
            entity_type='Referral',
            entity_id=referral.id,
            description=(
                f"Referral [{referral.referral_code}] responded to by "
                f"'{request.user.username}': {old_status} → {new_status}"
            ),
            ip_address=get_client_ip(request),
            metadata={
                'referral_code': referral.referral_code,
                'old_status': old_status,
                'new_status': new_status,
            }
        )

        # ── Notifications ──────────────────────────────────────
        try:
            from apps.notifications.models import Notification

            status_labels = {
                'accepted': 'accepted ✓',
                'rejected': 'rejected ✗',
                'call_required': 'requires a call',
            }
            label = status_labels.get(new_status, new_status)

            # Notify the health worker / hospital admin who created the referral
            creator = referral.created_by
            Notification.create_for_users(
                recipients=[creator],
                notification_type='referral_status',
                title=f"Referral {new_status.replace('_', ' ').title()}",
                message=(
                    f"Your referral [{referral.referral_code}] to "
                    f"{referral.destination_facility.name} has been {label}."
                    + (f" Note: {note}" if note else "")
                ),
                link_url='/user/referrals',
                metadata={
                    'referral_id': referral.id,
                    'referral_code': referral.referral_code,
                    'new_status': new_status,
                },
            )
        except Exception as notif_err:
            logger.warning("Failed to create referral-response notifications: %s", notif_err)
        # ── End Notifications ──────────────────────────────────

        return Response(
            ReferralDetailSerializer(referral, context={'request': request}).data
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        PATCH /api/referrals/{id}/update-status/
        Health worker marks patient as sent or arrived, or cancels.
        """
        referral = self.get_object()

        # Only the creating health worker can update patient status
        if (
            request.user.role == 'health_worker'
            and referral.created_by != request.user
        ):
            return Response(
                {'error': 'You can only update your own referrals.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Valid transition check
        allowed_transitions = {
            'accepted': ['patient_sent', 'cancelled'],
            'patient_sent': ['patient_arrived', 'cancelled'],
            'pending': ['cancelled'],
            'call_required': ['cancelled'],
        }

        allowed_next = allowed_transitions.get(referral.status, [])
        serializer = ReferralUpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        if new_status not in allowed_next:
            return Response(
                {
                    'error': (
                        f"Cannot transition from '{referral.status}' to '{new_status}'. "
                        f"Allowed: {allowed_next}"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = referral.status
        referral.status = new_status
        referral.save(update_fields=['status', 'updated_at'])

        ReferralEvent.objects.create(
            referral=referral,
            actor=request.user,
            old_status=old_status,
            new_status=new_status,
            note=note,
        )

        AuditLog.log(
            action='referral_status_update',
            actor=request.user,
            entity_type='Referral',
            entity_id=referral.id,
            description=(
                f"Referral [{referral.referral_code}] status updated by "
                f"'{request.user.username}': {old_status} → {new_status}"
            ),
            ip_address=get_client_ip(request),
            metadata={
                'referral_code': referral.referral_code,
                'old_status': old_status,
                'new_status': new_status,
            }
        )

        return Response(
            ReferralDetailSerializer(referral, context={'request': request}).data
        )
