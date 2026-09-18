"""
URL patterns for hospitals app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.hospitals.views import (
    HospitalViewSet,
    ServiceViewSet,
    HospitalServiceViewSet,
    AvailabilityViewSet,
)

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'hospital-services', HospitalServiceViewSet, basename='hospital-service')
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]
