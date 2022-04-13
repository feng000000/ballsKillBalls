from django.urls import path
from thegame.views.settings.getinfo import getinfo
from thegame.views.settings.login import signin

urlpatterns = [
    path("getinfo/", getinfo, name="settings_getinfo"),
    path("login/", signin, name="settings_login"),
]
