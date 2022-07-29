"""
ASGI config for acapp project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acapp.settings')
django.setup()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from thegame.routing import websocket_urlpatterns

# 引入channel_layer, 使得其他的app都可以使用channel_layer
# 这里是为了匹配系统能直接返回匹配结果给channel_layer中的group
from channels.layers import get_channel_layer
channel_layer = get_channel_layer()


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
})

