"""
Custom DRF permissions for UpacharKhoj Nepal.
Role-based access control for the healthcare coordination platform.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSystemAdmin(BasePermission):
    """
    Allows access only to system administrators.
    """
    message = 'System administrator access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'system_admin'
        )


class IsHospitalAdmin(BasePermission):
    """
    Allows access to hospital admins and system admins.
    """
    message = 'Hospital administrator access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('hospital_admin', 'system_admin')
        )


class IsHospitalStaff(BasePermission):
    """
    Allows access to hospital staff, hospital admins, and system admins.
    """
    message = 'Hospital staff access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('hospital_staff', 'hospital_admin', 'system_admin')
        )


class IsHealthWorker(BasePermission):
    """
    Allows access only to health workers.
    """
    message = 'Health worker access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'health_worker'
        )


class IsOwnHospital(BasePermission):
    """
    Object-level permission: hospital staff can only modify their own hospital's data.
    System admins bypass this restriction.
    """
    message = 'You can only modify data for your own hospital.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('hospital_staff', 'hospital_admin', 'system_admin')
        )

    def has_object_permission(self, request, view, obj):
        # System admins can access any hospital's data
        if request.user.role == 'system_admin':
            return True

        # Get the hospital associated with the object
        if hasattr(obj, 'hospital'):
            target_hospital = obj.hospital
        elif hasattr(obj, 'id') and obj.__class__.__name__ == 'Hospital':
            target_hospital = obj
        else:
            return False

        # Staff must be associated with the same hospital
        return (
            request.user.hospital is not None
            and request.user.hospital_id == target_hospital.id
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: owners can access their own objects, admins can access all.
    """
    message = 'You can only access your own data.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'system_admin':
            return True
        # Check if the object has a user/created_by field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Read-only for unauthenticated users, full access for authenticated.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated
