from django.urls import path, include
from thegame.views.settings.getinfo import getinfo
from thegame.views.settings.login import signin
from thegame.views.settings.logout import signout
from thegame.views.settings.register import register

urlpatterns = [
    path("getinfo/", getinfo, name="settings_getinfo"),
    path("login/", signin, name="settings_login"),
    path("logout/", signout, name="settings_logout"),
    path("register/", register, name="settings_register"),
    path("acwing/", include("thegame.urls.settings.acwing.index"))

]
