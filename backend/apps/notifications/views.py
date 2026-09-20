"""
Views for the notifications app.

Endpoints:
  GET    /api/notifications/          – list my notifications (newest first)
  POST   /api/notifications/mark-read/ – mark selected (or all) as read
  DELETE /api/notifications/clear/     – delete all my notifications
  GET    /api/notifications/unread-count/ – fast badge count
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.serializers import (
    NotificationSerializer,
    NotificationMarkReadSerializer,
)


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Returns the calling user's 50 most recent notifications.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Notification.objects
            .filter(recipient=request.user)
            .order_by('-created_at')[:50]
        )
        serializer = NotificationSerializer(qs, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    """
    POST /api/notifications/mark-read/
    Body: { "ids": [1, 2, 3] }  – mark specific notifications as read
    Body: { "mark_all": true }   – mark ALL unread notifications as read
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mark_all = serializer.validated_data.get('mark_all', False)
        ids = serializer.validated_data.get('ids', [])

        qs = Notification.objects.filter(recipient=request.user, is_read=False)

        if mark_all:
            updated = qs.update(is_read=True)
        elif ids:
            updated = qs.filter(id__in=ids).update(is_read=True)
        else:
            updated = 0

        return Response({'updated': updated}, status=status.HTTP_200_OK)


class NotificationClearView(APIView):
    """
    DELETE /api/notifications/clear/
    Deletes all notifications for the calling user.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        deleted, _ = Notification.objects.filter(recipient=request.user).delete()
        return Response({'deleted': deleted}, status=status.HTTP_200_OK)


class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/
    Lightweight endpoint — just returns {"count": N}
    Used for polling the badge without loading full payloads.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'count': count})
