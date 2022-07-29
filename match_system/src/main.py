#! /usr/bin/env python3

import glob
import sys
sys.path.insert(0, glob.glob('../..')[0])

from match_server.match_service import Match

# Queue是线程安全的同步队列
from queue import Queue
from time import sleep
from threading import Thread

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

from acapp.asgi import channel_layer
from asgiref.sync import async_to_sync
from django.core.cache import cache

# 定义全局的消息队列
queue = Queue()

class Player:
    def __init__(self, score, uuid, username, photo, channel_name):
        self.score = score
        self.uuid = uuid
        self.username = username
        self.photo = photo
        self.channel_name = channel_name
        self.waiting_time = 0 # 等待时间， 等待时间越长， 匹配标准越宽松

class Pool: # 匹配池
    def __init__(self):
        self.players = []


    def match(self):
        while len(self.players) >= 3:
            self.players = sorted(self.players, key=lambda p: p.score)
            flag = False
            for i in range(len(self.players) - 2):
                a, b, c = self.players[i], self.players[i + 1], self.players[i + 2]
                if self.check_match(a, b) and self.check_match(a, c) and self.check_match(b, c):
                    self.match_success([a, b, c])
                    self.players = self.players[:i] + self.players[i + 3:]
                    flag = True
                    break
            if not flag:
                break

        self.increase_waiting_time()


    def check_match(self, a, b):
        dt = abs(a.score - b.score)
        a_max_dif = a.waiting_time * 50
        b_max_dif = b.waiting_time * 50

        return dt <= a_max_dif and dt <= b_max_dif


    def match_success(self, ps): # ps为匹配成功的玩家列表, 当前为三人
        print("Match Success:\n %s\n %s\n %s\n" % (ps[0].username, ps[1].username, ps[2].username))
        room_name = "room-%s-%s-%s" % (ps[0].uuid, ps[1].uuid, ps[2].uuid)
        players = []
        for p in ps:
            async_to_sync(channel_layer.group_add)(room_name, p.channel_name)
            players.append({
                'uuid': p.uuid,
                'username': p.username,
                'photo': p.photo,
                'hp': 100,
            })
        cache.set(room_name, players, 3600) # 在缓存中添加一个值, 有效时间3600s
        for p in ps:
            async_to_sync(channel_layer.group_send)(
                room_name,
                {
                    'type': "group_send_event",
                    'event': "create_player",
                    'uuid': p.uuid,
                    'username': p.username,
                    'photo': p.photo,
                }
            )


    def add_player(self, player): # 将玩家加入匹配池中
        self.players.append(player)


    def remove():
        pass

    def increase_waiting_time(self):
        for player in self.players:
            player.waiting_time += 1


class MatchHandler:
    def add_player(self, score, uuid, username, photo, channel_name): # 将玩家加入队列中
        print("Add Player: %s %d" % (username, score))
        player = Player(score, uuid, username, photo, channel_name)
        queue.put(player)
        return 0


def get_player_from_queue():
    try:
        # get_nowait() 函数从队列中移除并返回一个元素, 如果队列中没有元素, 则会抛出异常, 被后面的except捕获
        return queue.get_nowait()
    except:
        return None



def worker(): # 消费者, 处理消息队列中的请求
    pool = Pool()
    while True:
        player = get_player_from_queue()
        if player:
            pool.add_player(player)
        else:
            pool.match()
            sleep(1)


if __name__ == '__main__':
    handler = MatchHandler()
    processor = Match.Processor(handler)
    transport = TSocket.TServerSocket(host='127.0.0.1', port=9090)
    tfactory = TTransport.TBufferedTransportFactory()
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()

    server = TServer.TThreadedServer( # 多线程server
        processor, transport, tfactory, pfactory)

    # 开一个线程， 执行函数是 worker ， daemon参数： 是否随着主线程的结束而结束
    Thread(target=worker, daemon=True).start()

    print('Starting the server...')
    server.serve()
    print('done.')


if __name__ == '__main__':
    main()

