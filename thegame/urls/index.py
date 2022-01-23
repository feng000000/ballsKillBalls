from django.urls import path, include
from thegame.views.index import index

urlpatterns = [
    path("", index, name="index"),
    path("menu/", include("thegame.urls.menu.index")),
    path("playground/", index("thegame.urls.playground.index")),
    path("settings/", include("thegame.urls.settings.index")),
]
