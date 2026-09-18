"""
Views for hospitals app.
Handles hospitals, services, and availability management.
"""

import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.hospitals.models import Hospital, Service, HospitalService, Availability
from apps.hospitals.serializers import (
    HospitalSerializer,
    HospitalDetailSerializer,
    HospitalWriteSerializer,
    ServiceSerializer,
    HospitalServiceSerializer,
    AvailabilitySerializer,
    AvailabilityWriteSerializer,
    BulkAvailabilitySerializer,
)
from apps.accounts.permissions import IsSystemAdmin, IsHospitalStaff, IsOwnHospital
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract the real IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def broadcast_availability_update(hospital_id, availability_data):
    """
    Broadcast availability update to WebSocket group for the hospital.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'availability_{hospital_id}',
                {
                    'type': 'availability_update',
                    'data': availability_data,
                }
            )
            # Also send to global channel
            async_to_sync(channel_layer.group_send)(
                'availability_global',
                {
                    'type': 'availability_update',
                    'data': {**availability_data, 'hospital_id': hospital_id},
                }
            )
    except Exception as e:
        logger.warning(f"Failed to broadcast availability update: {e}")


class HospitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Hospital CRUD and listing.
    - GET /api/hospitals/ - public list with filters
    - GET /api/hospitals/{id}/ - public detail
    - POST/PATCH/DELETE - system_admin only
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['district', 'municipality', 'type', 'verification_status', 'is_active']
    search_fields = ['name', 'address', 'district', 'municipality']
    ordering_fields = ['name', 'district', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = Hospital.objects.all()

        # Filter by service if provided
        service_id = self.request.query_params.get('service')
        if service_id:
            queryset = queryset.filter(
                hospital_services__service_id=service_id,
                hospital_services__is_available=True,
            ).distinct()

        # Public users see only active, verified hospitals
        user = self.request.user
        if not user.is_authenticated or user.role not in ('hospital_admin', 'system_admin'):
            queryset = queryset.filter(is_active=True, verification_status='verified')

        return queryset.select_related()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HospitalDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return HospitalWriteSerializer
        return HospitalSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsSystemAdmin()]

    def perform_create(self, serializer):
        hospital = serializer.save()
        AuditLog.log(
            action='hospital_create',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=hospital.id,
            description=f"Hospital '{hospital.name}' created by '{self.request.user.username}'.",
            ip_address=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        hospital = serializer.save()
        AuditLog.log(
            action='hospital_update',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=hospital.id,
            description=f"Hospital '{hospital.name}' updated by '{self.request.user.username}'.",
            ip_address=get_client_ip(self.request),
        )

    def perform_destroy(self, instance):
        name = instance.name
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        AuditLog.log(
            action='delete',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=instance.id,
            description=f"Hospital '{name}' deactivated by '{self.request.user.username}'.",
            ip_address=get_client_ip(self.request),
        )


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Service CRUD.
    - GET /api/services/ - public list
    - POST/PATCH/DELETE - system_admin only
    """
    queryset = Service.objects.all().order_by('name')
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsSystemAdmin()]

    def get_queryset(self):
        queryset = Service.objects.all()
        user = self.request.user
        if not user.is_authenticated or user.role != 'system_admin':
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('name')


class HospitalServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HospitalService management.
    - GET /api/hospital-services/?hospital={id} - public
    - POST/PATCH/DELETE - system_admin only
    """
    serializer_class = HospitalServiceSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hospital', 'service', 'is_available']

    def get_queryset(self):
        return HospitalService.objects.select_related(
            'hospital', 'service'
        ).order_by('hospital__name', 'service__name')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsSystemAdmin()]


class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Availability records.
    - GET /api/availability/?hospital={id} - public
    - POST/PATCH - hospital_staff or hospital_admin for their hospital
    - Bulk update - /api/availability/bulk-update/
    """
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['hospital', 'availability_type', 'status', 'is_active', 'service']
    ordering_fields = ['updated_at', 'availability_type']
    ordering = ['-updated_at']

    def get_queryset(self):
        queryset = Availability.objects.select_related(
            'hospital', 'service', 'updated_by'
        )
        user = self.request.user

        # Hospital staff can only see their own hospital's availability in write context
        if (
            user.is_authenticated
            and user.role in ('hospital_staff', 'hospital_admin')
            and self.action not in ('list', 'retrieve')
        ):
            if user.hospital:
                queryset = queryset.filter(hospital=user.hospital)

        return queryset

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return AvailabilityWriteSerializer
        return AvailabilitySerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsHospitalStaff()]

    def perform_create(self, serializer):
        availability = serializer.save()
        AuditLog.log(
            action='availability_update',
            actor=self.request.user,
            entity_type='Availability',
            entity_id=availability.id,
            description=(
                f"Availability for '{availability.hospital.name}' "
                f"({availability.get_availability_type_display()}) set to "
                f"'{availability.get_status_display()}'."
            ),
            ip_address=get_client_ip(self.request),
        )
        # Broadcast via WebSocket
        broadcast_availability_update(
            availability.hospital_id,
            AvailabilitySerializer(availability).data
        )

    def perform_update(self, serializer):
        availability = serializer.save()
        AuditLog.log(
            action='availability_update',
            actor=self.request.user,
            entity_type='Availability',
            entity_id=availability.id,
            description=(
                f"Availability for '{availability.hospital.name}' "
                f"({availability.get_availability_type_display()}) updated to "
                f"'{availability.get_status_display()}'."
            ),
            ip_address=get_client_ip(self.request),
        )
        broadcast_availability_update(
            availability.hospital_id,
            AvailabilitySerializer(availability).data
        )

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        """
        POST /api/availability/bulk-update/
        Update multiple availability records at once.
        """
        serializer = BulkAvailabilitySerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        updates = serializer.validated_data['updates']
        results = []

        with transaction.atomic():
            for update_data in updates:
                hospital = update_data['hospital']

                # Permission check for non-system-admins
                if request.user.role in ('hospital_staff', 'hospital_admin'):
                    if request.user.hospital is None or request.user.hospital_id != hospital.id:
                        return Response(
                            {'error': 'You can only update your own hospital\'s availability.'},
                            status=status.HTTP_403_FORBIDDEN
                        )

                # Update or create availability record
                availability_type = update_data['availability_type']
                service = update_data.get('service')

                lookup = {
                    'hospital': hospital,
                    'availability_type': availability_type,
                }
                if service:
                    lookup['service'] = service

                availability_obj, created = Availability.objects.update_or_create(
                    **lookup,
                    defaults={
                        'status': update_data.get('status', 'unknown'),
                        'available_count': update_data.get('available_count'),
                        'total_count': update_data.get('total_count'),
                        'notes': update_data.get('notes', ''),
                        'updated_by': request.user,
                        'source': 'manual',
                        'is_active': update_data.get('is_active', True),
                    }
                )
                results.append(AvailabilitySerializer(availability_obj).data)

                AuditLog.log(
                    action='availability_update',
                    actor=request.user,
                    entity_type='Availability',
                    entity_id=availability_obj.id,
                    description=(
                        f"Bulk availability update for '{hospital.name}' "
                        f"({availability_obj.get_availability_type_display()})."
                    ),
                    ip_address=get_client_ip(request),
                )
                broadcast_availability_update(hospital.id, AvailabilitySerializer(availability_obj).data)

        return Response({
            'updated': len(results),
            'results': results,
        }, status=status.HTTP_200_OK)
