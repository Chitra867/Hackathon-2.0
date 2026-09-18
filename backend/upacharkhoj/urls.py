"""
Main URL configuration for UpacharKhoj Nepal.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Hospital & service endpoints
    path('api/', include('apps.hospitals.urls')),

    # Referral endpoints
    path('api/', include('apps.referrals.urls')),

    # Audit log endpoints
    path('api/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
