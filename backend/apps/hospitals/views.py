"""
Views for hospitals app.

Handles:
- Hospital management
- Hospital searching and filtering
- Medical service management
- Hospital-service relationships
- Specialist and equipment availability
- Bulk availability updates
"""

import logging

from asgiref.sync import async_to_sync

from channels.layers import get_channel_layer

from django.db import transaction

from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import viewsets, status, filters

from rest_framework.decorators import action

from rest_framework.exceptions import PermissionDenied

from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)

from rest_framework.response import Response


from apps.hospitals.models import (
    Hospital,
    Service,
    HospitalService,
    Availability,
)

from apps.hospitals.serializers import (
    HospitalSerializer,
    HospitalDetailSerializer,
    HospitalWriteSerializer,
    HospitalProfileWriteSerializer,
    ServiceSerializer,
    HospitalServiceSerializer,
    AvailabilitySerializer,
    AvailabilityWriteSerializer,
    BulkAvailabilitySerializer,
)

from apps.accounts.permissions import (
    IsSystemAdmin,
    IsHospitalAdmin,
    IsHospitalStaff,
    IsOwnHospital,
)

from apps.audit.models import AuditLog


logger = logging.getLogger(__name__)


# =========================================================
# CLIENT IP ADDRESS
# =========================================================

def get_client_ip(request):
    """
    Extract the client IP address from the request.
    """

    x_forwarded_for = request.META.get(
        'HTTP_X_FORWARDED_FOR'
    )

    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR')


# =========================================================
# AVAILABILITY BROADCAST
# =========================================================

def broadcast_availability_update(
    hospital_id,
    availability_data,
):
    """
    Broadcast availability updates to hospital
    and global WebSocket channels.
    """

    try:

        channel_layer = get_channel_layer()

        if channel_layer:

            async_to_sync(
                channel_layer.group_send
            )(
                f'availability_{hospital_id}',
                {
                    'type': 'availability_update',
                    'data': availability_data,
                },
            )

            async_to_sync(
                channel_layer.group_send
            )(
                'availability_global',
                {
                    'type': 'availability_update',
                    'data': {
                        **availability_data,
                        'hospital_id': hospital_id,
                    },
                },
            )

    except Exception as error:

        logger.warning(
            "Failed to broadcast availability update: %s",
            error,
        )


# =========================================================
# HOSPITAL VIEWSET
# =========================================================

class HospitalViewSet(viewsets.ModelViewSet):

    """
    Hospital listing and management.

    Public users:
        - View verified and active hospitals.
        - Search hospitals by service name or ID.
        - Filter hospitals by district.
        - View hospital details.

    Hospital administrators:
        - Update their own hospital profile.

    System administrators:
        - Create hospitals.
        - Update hospitals.
        - Deactivate hospitals.
    """

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'district',
        'municipality',
        'type',
        'verification_status',
        'is_active',
    ]

    search_fields = [
        'name',
        'address',
        'district',
        'municipality',
    ]

    ordering_fields = [
        'name',
        'district',
        'created_at',
    ]

    ordering = ['name']

    # -----------------------------------------------------
    # GET HOSPITALS
    # -----------------------------------------------------

    def get_queryset(self):

        queryset = Hospital.objects.all()

        user = self.request.user

        # -------------------------------------------------
        # PUBLIC HOSPITAL VISIBILITY
        # -------------------------------------------------

        if (
            not user.is_authenticated
            or getattr(user, 'role', None)
            not in ('hospital_admin', 'system_admin')
        ):

            queryset = queryset.filter(
                is_active=True,
                verification_status='verified',
            )

        # -------------------------------------------------
        # SERVICE FILTER
        # -------------------------------------------------

        service_query = self.request.query_params.get(
            'service',
            '',
        ).strip()

        if service_query:

            # ---------------------------------------------
            # SEARCH BY NUMERIC SERVICE ID
            # ---------------------------------------------

            if service_query.isdecimal():

                queryset = queryset.filter(
                    hospital_services__service_id=int(
                        service_query
                    ),
                    hospital_services__is_available=True,
                    hospital_services__service__is_active=True,
                )

            # ---------------------------------------------
            # SEARCH BY SERVICE NAME OR CATEGORY
            # ---------------------------------------------

            else:

                queryset = queryset.filter(

                    Q(
                        hospital_services__service__name__icontains=service_query
                    )

                    |

                    Q(
                        hospital_services__service__category__iexact=service_query
                    ),

                    hospital_services__is_available=True,

                    hospital_services__service__is_active=True,

                )

            # Prevent duplicate hospitals when multiple
            # services match the search query.

            queryset = queryset.distinct()

        # -------------------------------------------------
        # RETURN QUERYSET
        # -------------------------------------------------

        return queryset.order_by('name')

    # -----------------------------------------------------
    # SERIALIZER SELECTION
    # -----------------------------------------------------

    def get_serializer_class(self):

        if self.action == 'retrieve':

            return HospitalDetailSerializer

        if (
            self.action == 'partial_update'
            and getattr(
                self.request.user,
                'role',
                None,
            ) == 'hospital_admin'
        ):

            return HospitalProfileWriteSerializer

        if self.action in (
            'create',
            'update',
            'partial_update',
        ):

            return HospitalWriteSerializer

        return HospitalSerializer

    # -----------------------------------------------------
    # PERMISSIONS
    # -----------------------------------------------------

    def get_permissions(self):

        if self.action in (
            'list',
            'retrieve',
        ):

            return [
                AllowAny(),
            ]

        if self.action == 'partial_update':

            return [
                IsAuthenticated(),
                IsHospitalAdmin(),
                IsOwnHospital(),
            ]

        return [
            IsAuthenticated(),
            IsSystemAdmin(),
        ]

    # -----------------------------------------------------
    # CREATE HOSPITAL
    # -----------------------------------------------------

    def perform_create(self, serializer):

        hospital = serializer.save()

        AuditLog.log(
            action='hospital_create',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=hospital.id,
            description=(
                f"Hospital '{hospital.name}' created by "
                f"'{self.request.user.username}'."
            ),
            ip_address=get_client_ip(
                self.request
            ),
        )

    # -----------------------------------------------------
    # UPDATE HOSPITAL
    # -----------------------------------------------------

    def perform_update(self, serializer):

        hospital = serializer.save()

        AuditLog.log(
            action='hospital_update',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=hospital.id,
            description=(
                f"Hospital '{hospital.name}' updated by "
                f"'{self.request.user.username}'."
            ),
            ip_address=get_client_ip(
                self.request
            ),
        )

    # -----------------------------------------------------
    # DEACTIVATE HOSPITAL
    # -----------------------------------------------------

    def perform_destroy(self, instance):

        name = instance.name

        instance.is_active = False

        instance.save(
            update_fields=['is_active']
        )

        AuditLog.log(
            action='delete',
            actor=self.request.user,
            entity_type='Hospital',
            entity_id=instance.id,
            description=(
                f"Hospital '{name}' deactivated by "
                f"'{self.request.user.username}'."
            ),
            ip_address=get_client_ip(
                self.request
            ),
        )


# =========================================================
# SERVICE VIEWSET
# =========================================================

class ServiceViewSet(viewsets.ModelViewSet):

    """
    Medical service management.

    Public:
        - List active services.
        - Retrieve service details.

    System administrators:
        - Create services.
        - Update services.
        - Delete services.
    """

    queryset = Service.objects.all().order_by(
        'name'
    )

    serializer_class = ServiceSerializer

    # -----------------------------------------------------
    # PERMISSIONS
    # -----------------------------------------------------

    def get_permissions(self):

        if self.action in (
            'list',
            'retrieve',
        ):

            return [
                AllowAny(),
            ]

        return [
            IsAuthenticated(),
            IsSystemAdmin(),
        ]

    # -----------------------------------------------------
    # GET SERVICES
    # -----------------------------------------------------

    def get_queryset(self):

        queryset = Service.objects.all()

        user = self.request.user

        if (
            not user.is_authenticated
            or getattr(user, 'role', None)
            != 'system_admin'
        ):

            queryset = queryset.filter(
                is_active=True
            )

        return queryset.order_by('name')


# =========================================================
# HOSPITAL SERVICE VIEWSET
# =========================================================

class HospitalServiceViewSet(
    viewsets.ModelViewSet
):

    """
    Manage the relationship between hospitals
    and the medical services they provide.

    Public:
        - View hospital-service relationships.

    System administrators:
        - Create hospital-service relationships.
        - Update hospital-service relationships.
        - Delete hospital-service relationships.
    """

    serializer_class = HospitalServiceSerializer

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = [
        'hospital',
        'service',
        'is_available',
    ]

    # -----------------------------------------------------
    # GET HOSPITAL SERVICES
    # -----------------------------------------------------

    def get_queryset(self):

        return HospitalService.objects.select_related(
            'hospital',
            'service',
        ).order_by(
            'hospital__name',
            'service__name',
        )

    # -----------------------------------------------------
    # PERMISSIONS
    # -----------------------------------------------------

    def get_permissions(self):

        if self.action in (
            'list',
            'retrieve',
        ):

            return [
                AllowAny(),
            ]

        return [
            IsAuthenticated(),
            IsSystemAdmin(),
        ]


# =========================================================
# AVAILABILITY VIEWSET
# =========================================================

class AvailabilityViewSet(
    viewsets.ModelViewSet
):

    """
    Manage hospital resource availability.

    Supported resources:
        - General beds
        - ICU beds
        - NICU beds
        - Specialists
        - Equipment
        - Diagnostic tests
        - Blood
        - Emergency services

    Public:
        - View availability information.

    Hospital staff and administrators:
        - Create availability records.
        - Update their own hospital's availability.
        - Perform bulk availability updates.
    """

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'hospital',
        'availability_type',
        'status',
        'is_active',
        'service',
    ]

    ordering_fields = [
        'updated_at',
        'availability_type',
    ]

    ordering = ['-updated_at']

    # -----------------------------------------------------
    # GET AVAILABILITY RECORDS
    # -----------------------------------------------------

    def get_queryset(self):

        queryset = Availability.objects.select_related(
            'hospital',
            'service',
            'updated_by',
        )

        user = self.request.user

        # Restrict hospital staff and administrators
        # to their own hospital when modifying records.

        if (
            user.is_authenticated
            and getattr(user, 'role', None)
            in ('hospital_staff', 'hospital_admin')
            and self.action not in (
                'list',
                'retrieve',
            )
        ):

            if user.hospital_id is None:

                return queryset.none()

            queryset = queryset.filter(
                hospital_id=user.hospital_id
            )

        return queryset

    # -----------------------------------------------------
    # SERIALIZER SELECTION
    # -----------------------------------------------------

    def get_serializer_class(self):

        if self.action in (
            'create',
            'update',
            'partial_update',
        ):

            return AvailabilityWriteSerializer

        return AvailabilitySerializer

    # -----------------------------------------------------
    # PERMISSIONS
    # -----------------------------------------------------

    def get_permissions(self):

        if self.action in (
            'list',
            'retrieve',
        ):

            return [
                AllowAny(),
            ]

        return [
            IsAuthenticated(),
            IsHospitalStaff(),
        ]

    # -----------------------------------------------------
    # VALIDATE HOSPITAL ACCESS
    # -----------------------------------------------------

    def validate_hospital_access(self, hospital):

        """
        Prevent hospital staff and administrators from
        creating or updating availability records
        belonging to another hospital.
        """

        user = self.request.user

        if getattr(user, 'role', None) in (
            'hospital_staff',
            'hospital_admin',
        ):

            if (
                user.hospital_id is None
                or user.hospital_id != hospital.id
            ):

                raise PermissionDenied(
                    "You can only manage your own "
                    "hospital's availability."
                )

    # -----------------------------------------------------
    # CREATE AVAILABILITY
    # -----------------------------------------------------

    def perform_create(self, serializer):

        hospital = serializer.validated_data['hospital']

        self.validate_hospital_access(
            hospital
        )

        availability = serializer.save()

        AuditLog.log(
            action='availability_update',
            actor=self.request.user,
            entity_type='Availability',
            entity_id=availability.id,
            description=(
                f"Availability for "
                f"'{availability.hospital.name}' "
                f"({availability.get_availability_type_display()}) "
                f"set to "
                f"'{availability.get_status_display()}'."
            ),
            ip_address=get_client_ip(
                self.request
            ),
        )

        broadcast_availability_update(
            availability.hospital_id,
            AvailabilitySerializer(
                availability
            ).data,
        )

    # -----------------------------------------------------
    # UPDATE AVAILABILITY
    # -----------------------------------------------------

    def perform_update(self, serializer):

        # If the request changes the hospital field,
        # validate the new hospital before saving.

        hospital = serializer.validated_data.get(
            'hospital',
            serializer.instance.hospital,
        )

        self.validate_hospital_access(
            hospital
        )

        availability = serializer.save()

        AuditLog.log(
            action='availability_update',
            actor=self.request.user,
            entity_type='Availability',
            entity_id=availability.id,
            description=(
                f"Availability for "
                f"'{availability.hospital.name}' "
                f"({availability.get_availability_type_display()}) "
                f"updated to "
                f"'{availability.get_status_display()}'."
            ),
            ip_address=get_client_ip(
                self.request
            ),
        )

        broadcast_availability_update(
            availability.hospital_id,
            AvailabilitySerializer(
                availability
            ).data,
        )

    # -----------------------------------------------------
    # BULK AVAILABILITY UPDATE
    # -----------------------------------------------------

    @action(
        detail=False,
        methods=['post'],
        url_path='bulk-update',
    )
    def bulk_update(self, request):

        """
        POST /api/availability/bulk-update/

        Update multiple availability records
        in a single request.
        """

        serializer = BulkAvailabilitySerializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        updates = serializer.validated_data[
            'updates'
        ]

        results = []

        # -------------------------------------------------
        # VALIDATE ALL HOSPITALS BEFORE SAVING
        # -------------------------------------------------

        # Verify every requested hospital before entering
        # the transaction to avoid partially applying
        # an unauthorized bulk request.

        for update_data in updates:

            hospital = update_data['hospital']

            self.validate_hospital_access(
                hospital
            )

        # -------------------------------------------------
        # PROCESS BULK UPDATES
        # -------------------------------------------------

        with transaction.atomic():

            for update_data in updates:

                hospital = update_data['hospital']

                availability_type = update_data[
                    'availability_type'
                ]

                service = update_data.get(
                    'service'
                )

                # -----------------------------------------
                # BUILD LOOKUP
                # -----------------------------------------

                lookup = {
                    'hospital': hospital,
                    'availability_type': availability_type,
                }

                if service:

                    lookup['service'] = service

                else:

                    lookup['service__isnull'] = True

                # -----------------------------------------
                # FIND EXISTING RECORD
                # -----------------------------------------

                existing_records = (
                    Availability.objects
                    .select_for_update()
                    .filter(**lookup)
                    .order_by('-updated_at', '-id')
                )

                availability_obj = (
                    existing_records.first()
                )

                # -----------------------------------------
                # PREPARE UPDATE VALUES
                # -----------------------------------------

                update_values = {
                    'status': update_data.get(
                        'status',
                        'unknown',
                    ),
                    'available_count': update_data.get(
                        'available_count'
                    ),
                    'total_count': update_data.get(
                        'total_count'
                    ),
                    'notes': update_data.get(
                        'notes',
                        '',
                    ),
                    'updated_by': request.user,
                    'source': 'manual',
                    'is_active': update_data.get(
                        'is_active',
                        True,
                    ),
                }

                # -----------------------------------------
                # UPDATE EXISTING RECORD
                # -----------------------------------------

                if availability_obj:

                    for field, value in (
                        update_values.items()
                    ):

                        setattr(
                            availability_obj,
                            field,
                            value,
                        )

                    availability_obj.save()

                # -----------------------------------------
                # CREATE NEW RECORD
                # -----------------------------------------

                else:

                    availability_obj = (
                        Availability.objects.create(
                            hospital=hospital,
                            availability_type=availability_type,
                            service=service,
                            **update_values,
                        )
                    )

                # -----------------------------------------
                # SERIALIZE RESULT
                # -----------------------------------------

                availability_data = (
                    AvailabilitySerializer(
                        availability_obj
                    ).data
                )

                results.append(
                    availability_data
                )

                # -----------------------------------------
                # AUDIT LOG
                # -----------------------------------------

                AuditLog.log(
                    action='availability_update',
                    actor=request.user,
                    entity_type='Availability',
                    entity_id=availability_obj.id,
                    description=(
                        f"Bulk availability update for "
                        f"'{hospital.name}' "
                        f"({availability_obj.get_availability_type_display()})."
                    ),
                    ip_address=get_client_ip(
                        request
                    ),
                )

                # -----------------------------------------
                # BROADCAST UPDATE
                # -----------------------------------------

                transaction.on_commit(
                    lambda hospital_id=hospital.id,
                    data=availability_data: (
                        broadcast_availability_update(
                            hospital_id,
                            data,
                        )
                    )
                )

        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        return Response(
            {
                'updated': len(results),
                'results': results,
            },
            status=status.HTTP_200_OK,
        )