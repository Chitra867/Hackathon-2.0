"""
URL patterns for accounts app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    LoginView,
    LogoutView,
    RegisterView,
    ProfileView,
    ChangePasswordView,
    ForgotPasswordView,
    ResetPasswordConfirmView,
    UserViewSet,
    PatientSearchView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password-confirm/', ResetPasswordConfirmView.as_view(), name='auth-reset-password-confirm'),
    path('patients/search/', PatientSearchView.as_view(), name='patient-search'),
    path('', include(router.urls)),
]
