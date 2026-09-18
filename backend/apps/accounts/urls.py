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
    UserViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('', include(router.urls)),
]
