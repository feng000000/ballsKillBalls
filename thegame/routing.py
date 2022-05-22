from django.urls import path
from thegame.consumers.multiplayer.index import MultiPlayer

websocket_urlpatterns = [
    path("wss/multiplayer/", MultiPlayer.as_asgi(), name="wss_multiplayer"),
]
