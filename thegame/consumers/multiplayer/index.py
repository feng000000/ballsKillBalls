from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self): # 请求连接时的函数
        print('connect')
        await self.accept()

    async def disconnect(self, close_code): # 断开连接函数, 但不是100%执行(如用户直接关机), 所以用于判断用户在线离线人数不太靠谱。
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)



    async def create_player(self, data): # 创建玩家
        # self.room_name 表示当前连接的房间号
        self.room_name = None;

        # 找有位置的房间, 暂定最大100个房间
        for i in range(100):
            name = "room-%d" % i;
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                # 房间还没开或者开了但是人数没到settings里设置的人数上限
                self.room_name = name;
                break;

        # 房间不够, 没有找到房间
        if not self.room_name:
            return


        if not cache.has_key(self.room_name): # 如果房间还没建立, 建立一个房间
            cache.set(self.room_name, [], 3600) # 建立房间, 值为一个列表, 放player, 有效期1小时

        # 服务器向本地发送已有玩家信息
        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({
                'event': "create_player",
                'uuid': player['uuid'],
                'username': player['username'],
                'photo': player['photo'],
                'roomname': self.room_name,
                }))

        # 真正把玩家加入到 ‘房间’ 里
        # django中有group的概念, 匹配到的玩家放在一个group里面
        # channels_layer.group_add() 将当前链接加到这个组里
        # 组内有向所有成员群发消息这样的功能(group_send)
        await self.channel_layer.group_add(self.room_name, self.channel_name)


        players = cache.get(self.room_name)
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo'],
        })
        cache.set(self.room_name, players, 3600)

        # 创建完玩家之后, 要通知房间内的其他玩家都创建这个玩家
        # group中的玩家之间通信, 发送内容到 函数名为 type的函数
        await self.channel_layer.group_send(
            self.room_name, # 和哪个房间通信
            {
                'type': "group_send_event", # 发送到函数名为 "group_send_event" 的函数
                'event': "create_player",
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
                'roomname': self.room_name,
            }
        )


    async def group_send_event(self, data): # 接收到创建玩家的请求之后, 服务器向本地发送信息
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
