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
    Doctor,
    PatientRequest,
    PatientRequestEvent,
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
    DoctorSerializer,
    DoctorWriteSerializer,
    PatientRequestSerializer,
    PatientRequestCreateSerializer,
    PatientRequestRespondSerializer,
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

        # Hospital admins can update their own hospital's
        # profile (contact/address fields only – enforced
        # by HospitalProfileWriteSerializer).
        # System admins can update ANY hospital, including
        # toggling is_active.
        if self.action == 'partial_update':

            return [
                IsAuthenticated(),
                IsHospitalAdmin(),  # allows hospital_admin + system_admin
                IsOwnHospital(),    # system_admin always passes object check
            ]

        # Dedicated toggle endpoint for system admins.
        if self.action == 'toggle_active':

            return [
                IsAuthenticated(),
                IsSystemAdmin(),
            ]

        return [
            IsAuthenticated(),
            IsSystemAdmin(),
        ]

    # -----------------------------------------------------
    # TOGGLE ACTIVE (system admin only)
    # -----------------------------------------------------

    @action(
        detail=True,
        methods=['post'],
        url_path='toggle-active',
    )
    def toggle_active(self, request, pk=None):
        """
        POST /api/hospitals/{id}/toggle-active/

        Activates or deactivates a hospital.
        Only accessible by system administrators.
        """

        hospital = self.get_object()
        hospital.is_active = not hospital.is_active
        hospital.save(update_fields=['is_active', 'updated_at'])

        AuditLog.log(
            action='hospital_update',
            actor=request.user,
            entity_type='Hospital',
            entity_id=hospital.id,
            description=(
                f"Hospital '{hospital.name}' "
                f"{'activated' if hospital.is_active else 'deactivated'} by "
                f"'{request.user.username}'."
            ),
            ip_address=get_client_ip(request),
        )

        return Response(
            {
                'id': hospital.id,
                'name': hospital.name,
                'is_active': hospital.is_active,
                'message': (
                    f"Hospital '{hospital.name}' has been "
                    f"{'activated' if hospital.is_active else 'deactivated'}."
                ),
            },
            status=status.HTTP_200_OK,
        )

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

    # -----------------------------------------------------
    # CREATE SERVICE — notify all hospital admins
    # -----------------------------------------------------

    def perform_create(self, serializer):
        service = serializer.save()
        try:
            from apps.notifications.models import Notification
            from apps.accounts.models import User as UserModel
            hospital_admins = list(
                UserModel.objects.filter(role='hospital_admin', is_active=True)
            )
            Notification.create_for_users(
                recipients=hospital_admins,
                notification_type='new_service_added',
                title='New Medical Service Added',
                message=(
                    f"A new service has been added by the administrator: "
                    f"\"{service.name}\" ({service.get_category_display()}). "
                    f"You can now link it to your hospital."
                ),
                link_url='/hadmin/availability',
                metadata={'service_id': service.id, 'service_name': service.name},
            )
        except Exception as notif_err:
            import logging as _log
            _log.getLogger(__name__).warning("Failed to create new-service notifications: %s", notif_err)


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


# ─────────────────────────────────────────────────────────────
# Doctor ViewSet
# ─────────────────────────────────────────────────────────────

class DoctorViewSet(viewsets.ModelViewSet):
    """
    Doctor management.

    GET  /api/doctors/           — authenticated, filtered by hospital
    POST /api/doctors/           — hospital admin / system admin
    PATCH/DELETE                 — hospital admin / system admin
    """

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['hospital', 'duty_status', 'is_active']
    search_fields = ['name', 'specialty', 'qualification']
    ordering_fields = ['name', 'specialty', 'updated_at']
    ordering = ['name']

    def get_queryset(self):
        return Doctor.objects.select_related('hospital', 'updated_by').all()

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DoctorWriteSerializer
        return DoctorSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsHospitalStaff()]

    def perform_create(self, serializer):
        doctor = serializer.save()
        AuditLog.log(
            action='doctor_create',
            actor=self.request.user,
            entity_type='Doctor',
            entity_id=doctor.id,
            description=f"Doctor '{doctor.name}' created for {doctor.hospital.name}.",
            ip_address=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        doctor = serializer.save()
        AuditLog.log(
            action='doctor_update',
            actor=self.request.user,
            entity_type='Doctor',
            entity_id=doctor.id,
            description=f"Doctor '{doctor.name}' updated.",
            ip_address=get_client_ip(self.request),
        )


# ─────────────────────────────────────────────────────────────
# Patient Request ViewSet
# ─────────────────────────────────────────────────────────────

class PatientRequestViewSet(viewsets.ModelViewSet):
    """
    Patient assistance request management.

    POST /api/patient-requests/             — authenticated user submits
    GET  /api/patient-requests/             — user sees own; hospital staff sees incoming
    GET  /api/patient-requests/{id}/        — detail (own only for users)
    PATCH /api/patient-requests/{id}/respond/ — hospital staff responds
    POST /api/patient-requests/{id}/cancel/   — patient cancels
    """

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['status', 'destination_hospital']
    search_fields = ['request_code', 'condition_summary']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        base_qs = PatientRequest.objects.select_related(
            'patient', 'destination_hospital', 'service', 'responded_by'
        ).prefetch_related('events__actor')

        if user.role == 'system_admin':
            return base_qs.all()

        if user.role == 'user':
            return base_qs.filter(patient=user)

        if user.role in ('hospital_staff', 'hospital_admin'):
            if user.hospital:
                return base_qs.filter(destination_hospital=user.hospital)

        return base_qs.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientRequestCreateSerializer
        if self.action == 'respond':
            return PatientRequestRespondSerializer
        return PatientRequestSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        self._check_access(request.user, instance)
        serializer = PatientRequestSerializer(instance, context={'request': request})
        return Response(serializer.data)

    def _check_access(self, user, req):
        if user.role == 'system_admin':
            return
        if user.role == 'user' and req.patient == user:
            return
        if user.role in ('hospital_staff', 'hospital_admin'):
            if user.hospital and req.destination_hospital_id == user.hospital_id:
                return
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied('You do not have access to this request.')

    def perform_create(self, serializer):
        pr = serializer.save()
        from apps.hospitals.models import PatientRequestEvent
        PatientRequestEvent.objects.create(
            request=pr,
            actor=self.request.user,
            old_status='',
            new_status='pending',
            note='Request submitted by patient.',
        )
        AuditLog.log(
            action='patient_request_create',
            actor=self.request.user,
            entity_type='PatientRequest',
            entity_id=pr.id,
            description=(
                f"Patient request [{pr.request_code}] created by "
                f"'{self.request.user.username}' for {pr.destination_hospital.name}."
            ),
            ip_address=get_client_ip(self.request),
        )

        # ── Notifications ──────────────────────────────────────
        try:
            from apps.notifications.models import Notification
            from apps.accounts.models import User as UserModel

            # 1. Notify super-admins
            super_admins = list(UserModel.objects.filter(role='system_admin', is_active=True))
            Notification.create_for_users(
                recipients=super_admins,
                notification_type='new_patient_request',
                title='New Patient Request',
                message=(
                    f"Patient {pr.patient.get_full_name() or pr.patient.username} "
                    f"submitted a request [{pr.request_code}] to "
                    f"{pr.destination_hospital.name}."
                ),
                link_url='/admin/patient-requests',
                metadata={'request_id': pr.id, 'request_code': pr.request_code},
            )

            # 2. Notify hospital admins/staff at destination
            dest_admins = list(
                UserModel.objects.filter(
                    role__in=['hospital_admin', 'hospital_staff'],
                    hospital=pr.destination_hospital,
                    is_active=True,
                )
            )
            Notification.create_for_users(
                recipients=dest_admins,
                notification_type='patient_request_incoming',
                title='Incoming Patient Request',
                message=(
                    f"New patient request [{pr.request_code}]: "
                    f"{pr.condition_summary[:100]}."
                ),
                link_url='/hadmin/patient-requests',
                metadata={'request_id': pr.id, 'request_code': pr.request_code},
            )
        except Exception as notif_err:
            logger.warning("Failed to create patient-request notifications: %s", notif_err)
        # ── End Notifications ──────────────────────────────────

    @action(detail=True, methods=['patch'], url_path='respond')
    def respond(self, request, pk=None):
        """Hospital staff or system admin accepts/rejects/calls a patient request."""
        pr = self.get_object()

        # Hospital staff/admin can only respond to their own hospital's requests
        if request.user.role in ('hospital_staff', 'hospital_admin'):
            if not request.user.hospital or pr.destination_hospital_id != request.user.hospital_id:
                return Response(
                    {'error': 'This request is not directed to your hospital.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        # system_admin can respond to any request — no extra check needed

        if pr.status not in ('pending', 'call_required'):
            return Response(
                {'error': f"Cannot respond to a request with status '{pr.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PatientRequestRespondSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = pr.status
        new_status = serializer.validated_data['status']
        note = serializer.validated_data.get('note', '')

        from django.utils import timezone as tz
        pr.status = new_status
        pr.responded_by = request.user
        pr.responded_at = tz.now()
        if note:
            pr.response_note = note
        pr.save(update_fields=['status', 'responded_by', 'responded_at', 'response_note', 'updated_at'])

        from apps.hospitals.models import PatientRequestEvent
        PatientRequestEvent.objects.create(
            request=pr,
            actor=request.user,
            old_status=old_status,
            new_status=new_status,
            note=note,
        )

        AuditLog.log(
            action='patient_request_respond',
            actor=request.user,
            entity_type='PatientRequest',
            entity_id=pr.id,
            description=f"Patient request [{pr.request_code}]: {old_status} → {new_status}.",
            ip_address=get_client_ip(request),
        )

        # ── Notifications ──────────────────────────────────────
        try:
            from apps.notifications.models import Notification

            status_labels = {
                'accepted': 'accepted ✓',
                'rejected': 'rejected ✗',
                'call_required': 'requires a call — please call the hospital',
            }
            label = status_labels.get(new_status, new_status.replace('_', ' '))

            # Notify the patient
            Notification.create_for_users(
                recipients=[pr.patient],
                notification_type='patient_request_status',
                title=f"Request {new_status.replace('_', ' ').title()}",
                message=(
                    f"Your request [{pr.request_code}] to "
                    f"{pr.destination_hospital.name} has been {label}."
                    + (f" Note: {note}" if note else "")
                ),
                link_url='/user/referrals',
                metadata={
                    'request_id': pr.id,
                    'request_code': pr.request_code,
                    'new_status': new_status,
                },
            )
        except Exception as notif_err:
            logger.warning("Failed to create patient-request respond notifications: %s", notif_err)
        # ── End Notifications ──────────────────────────────────

        return Response(PatientRequestSerializer(pr, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Patient cancels their own request."""
        pr = self.get_object()

        if request.user.role == 'user' and pr.patient != request.user:
            return Response({'error': 'You can only cancel your own requests.'}, status=status.HTTP_403_FORBIDDEN)

        if pr.status in ('accepted', 'rejected', 'cancelled'):
            return Response({'error': f"Cannot cancel a request with status '{pr.status}'."}, status=status.HTTP_400_BAD_REQUEST)

        old_status = pr.status
        pr.status = 'cancelled'
        pr.save(update_fields=['status', 'updated_at'])

        from apps.hospitals.models import PatientRequestEvent
        PatientRequestEvent.objects.create(
            request=pr,
            actor=request.user,
            old_status=old_status,
            new_status='cancelled',
            note='Cancelled by patient.',
        )

        return Response(PatientRequestSerializer(pr, context={'request': request}).data)


# ─────────────────────────────────────────────────────────────
# User Portal: Hospital Search API
# ─────────────────────────────────────────────────────────────

from rest_framework.views import APIView
import math


def haversine_km(lat1, lon1, lat2, lon2):
    """Return great-circle distance in kilometres between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class UserHospitalSearchView(APIView):
    """
    GET /api/user/hospital-search/

    Query params:
      q           — free-text (hospital name, service name, disease keyword)
      service_id  — exact Service PK
      district    — filter by district
      emergency   — 'true' to filter by emergency services
      lat, lng    — user coordinates for distance sorting
      page, page_size
    """
    permission_classes = [IsAuthenticated]

    # Mapping from common disease/symptom keywords to service categories
    KEYWORD_MAP = {
        'heart': ['cardiology', 'emergency'],
        'cardiac': ['cardiology', 'emergency'],
        'chest pain': ['cardiology', 'emergency'],
        'baby': ['nicu', 'maternity', 'pediatrics'],
        'newborn': ['nicu', 'maternity'],
        'pregnancy': ['maternity'],
        'maternity': ['maternity'],
        'birth': ['maternity'],
        'kidney': ['dialysis'],
        'dialysis': ['dialysis'],
        'bone': ['orthopedics'],
        'fracture': ['orthopedics', 'emergency'],
        'eye': ['ophthalmology'],
        'ear': ['ent'],
        'child': ['pediatrics'],
        'brain': ['neurology'],
        'stroke': ['neurology', 'emergency'],
        'blood': ['bloodbank'],
        'icu': ['icu'],
        'scan': ['ct', 'mri'],
        'ct': ['ct'],
        'mri': ['mri'],
        'surgery': ['surgery', 'emergency'],
        'emergency': ['emergency'],
        'accident': ['emergency', 'surgery'],
        'burn': ['emergency'],
    }

    def get(self, request):
        q = (request.query_params.get('q') or '').strip().lower()
        service_id = request.query_params.get('service_id')
        district = request.query_params.get('district', '').strip()
        emergency = request.query_params.get('emergency', '').lower() == 'true'
        try:
            user_lat = float(request.query_params.get('lat', 0))
            user_lng = float(request.query_params.get('lng', 0))
        except (TypeError, ValueError):
            user_lat = user_lng = 0

        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(50, max(1, int(request.query_params.get('page_size', 20))))

        qs = Hospital.objects.filter(
            is_active=True,
            verification_status='verified',
        ).prefetch_related(
            'hospital_services__service',
            'availability_records',
            'doctors',
        )

        # District filter
        if district:
            qs = qs.filter(district__icontains=district)

        # Emergency: must have emergency service
        if emergency:
            qs = qs.filter(
                hospital_services__service__category='emergency',
                hospital_services__is_available=True,
            ).distinct()

        # Service ID filter
        if service_id:
            try:
                qs = qs.filter(
                    hospital_services__service_id=int(service_id),
                    hospital_services__is_available=True,
                ).distinct()
            except (ValueError, TypeError):
                pass

        # Free-text search
        if q:
            # Check keyword→category mapping
            matched_categories = []
            for keyword, categories in self.KEYWORD_MAP.items():
                if keyword in q:
                    matched_categories.extend(categories)

            if matched_categories:
                qs = qs.filter(
                    hospital_services__service__category__in=matched_categories,
                    hospital_services__is_available=True,
                ).distinct()
            else:
                # Search by hospital name or service name
                from django.db.models import Q as DQ
                qs = qs.filter(
                    DQ(name__icontains=q)
                    | DQ(address__icontains=q)
                    | DQ(hospital_services__service__name__icontains=q)
                    | DQ(hospital_services__service__description__icontains=q)
                    | DQ(doctors__name__icontains=q)
                    | DQ(doctors__specialty__icontains=q)
                ).distinct()

        hospitals = list(qs)

        # Attach distance
        has_coords = user_lat != 0 and user_lng != 0
        results = []
        for h in hospitals:
            d = None
            if has_coords and h.latitude and h.longitude:
                d = round(haversine_km(user_lat, user_lng, h.latitude, h.longitude), 2)

            # Key availability summaries
            av_records = [a for a in h.availability_records.all() if a.is_active]
            bed_record = next((a for a in av_records if a.availability_type == 'bed'), None)
            icu_record = next((a for a in av_records if a.availability_type == 'icu'), None)
            emergency_record = next((a for a in av_records if a.availability_type == 'emergency'), None)

            on_duty_doctors = [
                {'name': doc.name, 'specialty': doc.specialty, 'duty_status': doc.duty_status}
                for doc in h.doctors.all()
                if doc.is_active and doc.duty_status == 'on_duty'
            ]

            services = [
                {
                    'id': hs.service_id,
                    'name': hs.service.name,
                    'category': hs.service.category,
                    'is_available': hs.is_available,
                }
                for hs in h.hospital_services.all()
                if hs.is_available
            ]

            results.append({
                'id': h.id,
                'name': h.name,
                'type': h.type,
                'type_display': h.get_type_display(),
                'address': h.address,
                'district': h.district,
                'municipality': h.municipality,
                'lat': float(h.latitude) if h.latitude else None,
                'lng': float(h.longitude) if h.longitude else None,
                'phone': h.phone,
                'emergency_contact': h.emergency_contact,
                'distance_km': d,
                'services': services,
                'beds': {
                    'status': bed_record.status if bed_record else 'unknown',
                    'available': bed_record.available_count if bed_record else None,
                    'total': bed_record.total_count if bed_record else None,
                    'updated_at': bed_record.updated_at.isoformat() if bed_record else None,
                } if bed_record else {'status': 'unknown', 'available': None, 'total': None, 'updated_at': None},
                'icu': {
                    'status': icu_record.status if icu_record else 'unknown',
                    'available': icu_record.available_count if icu_record else None,
                    'total': icu_record.total_count if icu_record else None,
                    'updated_at': icu_record.updated_at.isoformat() if icu_record else None,
                } if icu_record else {'status': 'unknown', 'available': None, 'total': None, 'updated_at': None},
                'emergency_dept': {
                    'status': emergency_record.status if emergency_record else 'unknown',
                    'updated_at': emergency_record.updated_at.isoformat() if emergency_record else None,
                },
                'on_duty_doctors': on_duty_doctors,
                'on_duty_doctors_count': len(on_duty_doctors),
            })

        # Sort by distance if coordinates available, else by name
        if has_coords:
            results.sort(key=lambda x: (x['distance_km'] is None, x['distance_km'] or 9999))
        else:
            results.sort(key=lambda x: x['name'])

        # Paginate
        total = len(results)
        start = (page - 1) * page_size
        end = start + page_size
        paginated = results[start:end]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': math.ceil(total / page_size) if total else 1,
            'results': paginated,
        })


class UserHospitalDetailView(APIView):
    """
    GET /api/user/hospitals/{id}/

    Returns detailed hospital profile for authenticated users including
    doctors, all availability records, and services.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            hospital = Hospital.objects.prefetch_related(
                'hospital_services__service',
                'availability_records__service',
                'availability_records__updated_by',
                'doctors__updated_by',
            ).get(pk=pk, is_active=True, verification_status='verified')
        except Hospital.DoesNotExist:
            return Response({'error': 'Hospital not found.'}, status=status.HTTP_404_NOT_FOUND)

        av_records = [a for a in hospital.availability_records.all() if a.is_active]

        def av_data(record):
            return {
                'id': record.id,
                'type': record.availability_type,
                'type_display': record.get_availability_type_display(),
                'status': record.status,
                'status_display': record.get_status_display(),
                'available_count': record.available_count,
                'total_count': record.total_count,
                'notes': record.notes,
                'updated_at': record.updated_at.isoformat(),
                'freshness_label': record.freshness_label,
                'age_minutes': record.age_minutes,
            }

        doctors = [
            {
                'id': d.id,
                'name': d.name,
                'specialty': d.specialty,
                'qualification': d.qualification,
                'phone': d.phone,
                'duty_status': d.duty_status,
                'duty_status_display': d.get_duty_status_display(),
                'consultation_days': d.consultation_days,
                'consultation_time': d.consultation_time,
                'updated_at': d.updated_at.isoformat(),
            }
            for d in hospital.doctors.filter(is_active=True)
        ]

        services = [
            {
                'id': hs.service_id,
                'name': hs.service.name,
                'category': hs.service.category,
                'category_display': hs.service.get_category_display(),
                'is_available': hs.is_available,
                'notes': hs.notes,
            }
            for hs in hospital.hospital_services.all()
        ]

        # Patient's own requests to this hospital
        my_requests = []
        if request.user.role == 'user':
            my_requests = list(
                PatientRequest.objects.filter(
                    patient=request.user,
                    destination_hospital=hospital,
                ).values(
                    'id', 'request_code', 'status', 'condition_summary',
                    'created_at', 'updated_at'
                ).order_by('-created_at')[:5]
            )

        return Response({
            'id': hospital.id,
            'name': hospital.name,
            'type': hospital.type,
            'type_display': hospital.get_type_display(),
            'address': hospital.address,
            'district': hospital.district,
            'municipality': hospital.municipality,
            'lat': float(hospital.latitude) if hospital.latitude else None,
            'lng': float(hospital.longitude) if hospital.longitude else None,
            'phone': hospital.phone,
            'email': hospital.email,
            'website': hospital.website,
            'emergency_contact': hospital.emergency_contact,
            'verification_status': hospital.verification_status,
            'services': services,
            'availability': [av_data(a) for a in av_records],
            'doctors': doctors,
            'my_requests': my_requests,
        })


class UserDashboardView(APIView):
    """
    GET /api/user/dashboard/

    Returns personalised dashboard data: recent requests, nearby hospitals summary.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        recent_requests = []
        if user.role == 'user':
            recent_requests = list(
                PatientRequest.objects.filter(patient=user)
                .select_related('destination_hospital', 'service')
                .order_by('-created_at')[:5]
                .values(
                    'id', 'request_code', 'status',
                    'destination_hospital__name',
                    'service__name',
                    'created_at', 'updated_at'
                )
            )

        # Stats
        pending_count = PatientRequest.objects.filter(patient=user, status='pending').count() if user.role == 'user' else 0
        active_count = PatientRequest.objects.filter(patient=user, status__in=['pending', 'accepted', 'call_required']).count() if user.role == 'user' else 0

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name() or user.username,
                'email': user.email,
            },
            'stats': {
                'total_requests': PatientRequest.objects.filter(patient=user).count() if user.role == 'user' else 0,
                'pending_requests': pending_count,
                'active_requests': active_count,
            },
            'recent_requests': recent_requests,
        })


class UserSearchSuggestionsView(APIView):
    """
    GET /api/user/search-suggestions/?q=<query>

    Returns autocomplete suggestions for the hospital search bar.
    Suggestions come from:
      - Hospital names
      - Service names
      - Doctor specialties
      - District names
    Returns up to 8 suggestions ranked by relevance.
    Open to unauthenticated users so the public search page can use it.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()
        if len(q) < 2:
            return Response({'suggestions': []})

        from django.db.models import Q as DQ

        suggestions = []
        seen = set()

        def add(text, kind, extra=None):
            key = text.lower()
            if key not in seen:
                seen.add(key)
                entry = {'label': text, 'type': kind}
                if extra:
                    entry.update(extra)
                suggestions.append(entry)

        # Hospital names
        hospitals = (
            Hospital.objects.filter(
                name__icontains=q,
                is_active=True,
                verification_status='verified',
            )
            .values('id', 'name', 'district')
            .order_by('name')[:4]
        )
        for h in hospitals:
            add(h['name'], 'hospital', {'id': h['id'], 'subtitle': h['district']})

        # Service names
        services = (
            Service.objects.filter(name__icontains=q, is_active=True)
            .values('id', 'name', 'category')
            .order_by('name')[:4]
        )
        for s in services:
            add(s['name'], 'service', {'id': s['id']})

        # Doctor specialties (distinct)
        specialties = (
            Doctor.objects.filter(specialty__icontains=q, is_active=True)
            .values_list('specialty', flat=True)
            .distinct()
            .order_by('specialty')[:3]
        )
        for sp in specialties:
            add(sp, 'specialty')

        # Districts
        districts = (
            Hospital.objects.filter(
                district__icontains=q,
                is_active=True,
                verification_status='verified',
            )
            .values_list('district', flat=True)
            .distinct()
            .order_by('district')[:3]
        )
        for d in districts:
            add(d, 'district')

        return Response({'suggestions': suggestions[:8]})
