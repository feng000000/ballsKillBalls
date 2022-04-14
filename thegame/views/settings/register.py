from django.contrib.auth import login
from django.http import JsonResponse

# 导入django中的用户类
from django.contrib.auth.models import User

# 导入数据库中的Player类
from thegame.models.player.player import Player

def register(request):
    data = request.GET
    username = data.get("username", "").strip() # strip() 去掉字符串前后空格
    password = data.get("password", "").strip()
    password_confirm = data.get("password_confirm", "").strip()
    if not username or not password:
        return JsonResponse({
            'result': "用户名密码不能为空",
        })
    if password != password_confirm:
        return JsonResponse({
            'result': "两个密码不一致",
        })
    if User.objects.filter(username=username).exists(): # 查找数据库看用户名是否存在
        return JsonResponse({
            'result': "用户名已存在",
        })
    user = User(username=username)
    user.set_password(password)
    user.save()
    Player.objects.create(user=user, photo="https://img0.baidu.com/it/u=178892670,2966992691&fm=253&fmt=auto&app=138&f=JPEG?w=400&h=400")
    login(request, user)
    return JsonResponse({
        'result': "success"
    })
