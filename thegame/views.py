from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align: center">球球对战</h1>'
    line2 = '<img src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.52miji.com%2Fimage%2F2016%2F09%2F23%2F146e29c3c001304525aa6aeb40485faa.jpg&refer=http%3A%2F%2Fimg.52miji.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1645297322&t=196dda30de956c500e10388bf701cb1e">'
    return HttpResponse(line1 + line2)
