from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from match_system.src.match_server.match_service import Match
from thegame.models.player.player import Player
from channels.db import database_sync_to_async

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self): # 请求连接时的函数
        await self.accept()

    async def disconnect(self, close_code): # 断开连接函数, 但不是100%执行(如用户直接关机), 所以用于判断用户在线离线人数不太靠谱。
        if self.room_name: # 退出时, 如果在某一个房间里, 则将channel_name从group里删除(channel理解为该用户创建的通道?)
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self, data): # 创建玩家
        self.room_name = None
        self.uuid = data["uuid"]

        # Make socket
        transport = TSocket.TSocket('127.0.0.1', 9090)

        # Buffering is critical. Raw sockets are very slow
        transport = TTransport.TBufferedTransport(transport)

        # Wrap in a protocol
        protocol = TBinaryProtocol.TBinaryProtocol(transport)

        # Create a client to use the protocol encoder
        client = Match.Client(protocol)

        def db_get_player():
            return Player.objects.get(user__username=data["username"])

        player = await database_sync_to_async(db_get_player)()


        # Connect!
        transport.open()

        client.add_player(player.score, self.uuid, data["username"], data["photo"], self.channel_name)

        # Close!
        transport.close()


    async def group_send_event(self, data): # 接收到创建玩家的请求之后, 服务器向本地发送信息
        if not self.room_name:
            # 因为房间号中保存了三个人的uuid, 所以这里用正则匹配cache中含有 self.uuid的房间
            # keys返回一个包含结果的数组
            keys = cache.keys('*%s*' % (self.uuid))

            if keys:
                self.room_name = keys[0]

        await self.send(text_data=json.dumps(data))



    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event' : "move_to",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "shoot_fireball",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'fireball_uuid': data['fireball_uuid'],
            }
        )

    async def stop_move(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "stop_move",
                'uuid': data['uuid'],
            }
        )

    async def attack(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "attack",
                'uuid': data['uuid'],
                'attacked_uuid': data['attacked_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],
            }
        )

    async def flash(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "flash",
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def message(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': "message",
                'uuid': data['uuid'],
                'username': data['username'],
                'text': data['text'],
            }
        )


    async def receive(self, text_data): # receive接受前端到后端的信息
        data = json.loads(text_data)
        event = data['event']
        if event == "create_player":
            await self.create_player(data)
        elif event == "move_to":
            await self.move_to(data)
        elif event == "shoot_fireball":
            await self.shoot_fireball(data)
        elif event == "stop_move":
            await self.stop_move(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "flash":
            await self.flash(data)
        elif event == "message":
            await self.message(data)
