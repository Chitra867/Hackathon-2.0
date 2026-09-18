"""
WebSocket URL routing for UpacharKhoj.
"""

from django.urls import re_path
from apps.hospitals import consumers

websocket_urlpatterns = [
    # Real-time availability updates for a specific hospital
    re_path(
        r'ws/availability/(?P<hospital_id>\d+)/$',
        consumers.AvailabilityConsumer.as_asgi()
    ),
    # General availability broadcast channel
    re_path(
        r'ws/availability/$',
        consumers.AvailabilityBroadcastConsumer.as_asgi()
    ),
]
