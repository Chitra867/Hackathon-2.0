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
    DoctorViewSet,
    PatientRequestViewSet,
    UserHospitalSearchView,
    UserHospitalDetailView,
    UserDashboardView,
    UserSearchSuggestionsView,
)

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'hospital-services', HospitalServiceViewSet, basename='hospital-service')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'patient-requests', PatientRequestViewSet, basename='patient-request')

urlpatterns = [
    path('', include(router.urls)),

    # User portal dedicated endpoints
    path('user/dashboard/', UserDashboardView.as_view(), name='user-dashboard'),
    path('user/hospital-search/', UserHospitalSearchView.as_view(), name='user-hospital-search'),
    path('user/hospitals/<int:pk>/', UserHospitalDetailView.as_view(), name='user-hospital-detail'),
    path('user/search-suggestions/', UserSearchSuggestionsView.as_view(), name='user-search-suggestions'),
]
