# 接收code
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib.auth.models import User
from thegame.models.player.player import Player
from django.core.cache import cache
import requests
from random import randint


def receive_code(request):
    data = request.GET

    if "errcode" in data:
        return JsonResponse({
            'result': "apply failed",
            'errcode': data['errcode'],
            'errmsg': data['errmsg'],
        })


    code = data.get('code')
    state = data.get('state')

    if not cache.has_key(state): # state不对直接返回
        return JsonResponse({
            'result': "state not exists"
        })
    cache.delete(state)

    apply_access_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    params = {
        'appid': "1793",
        'secret': "430027c145434ebc80d05a0fb2d3fde3",
        'code': code
    }

    access_token_res = requests.get(apply_access_token_url, params=params).json()

    access_token = access_token_res['access_token']
    openid = access_token_res['openid']

    players = Player.objects.filter(openid=openid) # filter返回一个列表 如果查询元素不存在则列表为空
    if players.exists(): # 如果该用户已存在, 则无需重新获取信息, 直接登陆即可
        player = players[0]
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })

    get_userinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params = {
        'access_token': access_token,
        'openid': openid
    }

    userinfo_res = requests.get(get_userinfo_url, params=params).json()
    username = userinfo_res['username']
    photo = userinfo_res['photo']

    while User.objects.filter(username=username).exists(): # 找到一个当前不存在的用户名
        username += str(randint(0, 9))

    # 创建新用户
    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)


    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo,
    })
