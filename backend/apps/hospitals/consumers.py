"""
Django Channels consumers for real-time availability updates.
Clients subscribe to a hospital's availability channel and receive
live updates whenever staff update availability records.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)


class AvailabilityConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for a single hospital's availability feed.
    URL: ws/availability/{hospital_id}/

    On connect: joins the group for this hospital.
    On receive: allows authenticated staff to push updates (broadcasts to group).
    On disconnect: leaves the group.
    """

    async def connect(self):
        self.hospital_id = self.scope['url_route']['kwargs']['hospital_id']
        self.group_name = f'availability_{self.hospital_id}'

        # Join the hospital availability group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )
        await self.accept()
        logger.debug(
            f"WS connect: hospital_id={self.hospital_id}, "
            f"channel={self.channel_name}"
        )

    async def disconnect(self, close_code):
        # Leave the hospital availability group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name,
        )
        logger.debug(
            f"WS disconnect: hospital_id={self.hospital_id}, code={close_code}"
        )

    async def receive(self, text_data):
        """
        Handle messages from the WebSocket client.
        Currently supports a ping/pong heartbeat.
        Actual updates are pushed server-side via group_send.
        """
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f"Unknown message type: {msg_type}",
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON received.',
            }))

    async def availability_update(self, event):
        """
        Receive availability update from channel layer group_send
        and forward to the WebSocket client.
        """
        await self.send(text_data=json.dumps({
            'type': 'availability_update',
            'data': event['data'],
        }))


class AvailabilityBroadcastConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for the global availability broadcast channel.
    URL: ws/availability/

    Clients receive updates for ALL hospitals.
    Useful for dashboards that display multiple hospitals.
    """

    GLOBAL_GROUP = 'availability_global'

    async def connect(self):
        await self.channel_layer.group_add(
            self.GLOBAL_GROUP,
            self.channel_name,
        )
        await self.accept()
        logger.debug(f"WS global connect: channel={self.channel_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.GLOBAL_GROUP,
            self.channel_name,
        )
        logger.debug(f"WS global disconnect: code={close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON.',
            }))

    async def availability_update(self, event):
        """Forward global availability updates to the WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'availability_update',
            'data': event['data'],
        }))
