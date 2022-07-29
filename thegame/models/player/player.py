from django.db import models
from django.contrib.auth.models import User



class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    photo = models.URLField(max_length=256, blank=True)

    # CharField: django提供的一个字符串字段, 适用于小到大的字符串
    openid = models.CharField(default="", max_length=50, blank=True, null=True)

    score = models.IntegerField(default=1500)

    # 当使用print输出对象的时候, 
    # 只要自己定义了__str__(self)方法, 那么就会打印从在这个方法中return的数据
    def __str__(self):
        return str(self.user)
