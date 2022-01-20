from django.urls import path
from thegame.views import index

urlpatterns = [
    path("", index, name = "index"),
]
