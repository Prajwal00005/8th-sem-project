# hamroapp/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from .models import ChatRoom, Message
from rest_framework.authtoken.models import Token
from urllib.parse import parse_qs

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_room_id = self.scope['url_route']['kwargs']['chat_room_id']
        self.channel_layer = get_channel_layer()
        if self.channel_layer is None:
            print("Connection rejected: Channel layer is None")
            await self.close()
            return
        self.room_group_name = f'chat_{self.chat_room_id}'
        query_string = self.scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token', [None])[0]
        print(f"Token from query: {token}")

        if not token:
            print("Connection rejected: No token provided")
            await self.close()
            return

        try:
            token_obj = await database_sync_to_async(Token.objects.select_related('user').get)(key=token)
            self.user = token_obj.user  # Store resolved User instance
        except Token.DoesNotExist:
            print("Connection rejected: Invalid token")
            await self.close()
            return

        print(f"User: {self.user}, Authenticated: {self.user.is_authenticated}, Role: {getattr(self.user, 'role', 'N/A')}")
        if not self.user.is_authenticated or getattr(self.user, 'role', None) != 'resident':
            print("Connection rejected: User not authenticated or not a resident")
            await self.close()
            return

        try:
            chat_room = await database_sync_to_async(ChatRoom.objects.get)(id=self.chat_room_id)
            participants = await database_sync_to_async(list)(chat_room.participants.all())
            if chat_room.apartment_name != self.user.apartmentName or self.user not in participants:
                print("Connection rejected: User not in apartment or not a participant")
                await self.close()
                return
        except ChatRoom.DoesNotExist:
            print(f"Connection rejected: Chat room {self.chat_room_id} does not exist")
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        print(f"WebSocket connected: {self.channel_name} to {self.room_group_name}")

    async def disconnect(self, close_code):
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            print(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_body = text_data_json['body']
        chat_room = await database_sync_to_async(ChatRoom.objects.get)(id=self.chat_room_id)
        message = await database_sync_to_async(Message.objects.create)(
            chat_room=chat_room,
            sender=self.user,
            body=message_body
        )
        if self.channel_layer is not None:
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": {
                    "sender": self.user.username,
                    "body": message_body,
                    "timestamp": message.timestamp.isoformat(),
                    "status": "delivered"  # Add status
                }
            }
        )
        print(f"Sent message: {message_body} from {self.user.username}")

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"message": event["message"]}))
        print(f"Delivered message: {event['message']['body']}")