"""URL patterns for the notifications app."""

from django.urls import path
from apps.notifications.views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationClearView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path('notifications/',              NotificationListView.as_view(),       name='notifications-list'),
    path('notifications/mark-read/',    NotificationMarkReadView.as_view(),    name='notifications-mark-read'),
    path('notifications/clear/',        NotificationClearView.as_view(),       name='notifications-clear'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notifications-unread-count'),
]
