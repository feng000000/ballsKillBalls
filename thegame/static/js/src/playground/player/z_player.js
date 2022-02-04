class Player extends AcGameObject
{
    constructor(playground, x, y, radius, color, speed, is_me)
    {
        // playground 地图
        // x, y 坐标
        // radius 球的半径 color 球的颜色
        // speed 每秒钟移动百分之多少 (在不同分辨率下时速度看起来一致, 所以用百分比速度)
        // is_me 判断是不是自己

        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0; // vx指x方向上的每帧移动的距离, vy指y方向上的
        this.vy = 0;
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.move_length = 0; // 要移动的距离
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.is_me = is_me;
        this.eps = 0.1; //因为涉及浮点运算, 所以规定一个极小值
        this.friction = 0.9;

        this.cur_skill = null; // 当前选择的技能是什么

    }

    start()
    {
        if(this.is_me)
        {
            this.add_listening_events();
        }
        else
        {
            let tx = Math.random() * this.playground.width;
            let ty = Math.random() * this.playground.height;
            this.move_to(tx, ty);
        }
    }

    add_listening_events()
    {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu",
            function()
            {
                // 关闭右键打开菜单
                return false;
            }
        );

        this.playground.game_map.$canvas.mousedown(
            function(e)
            {
                if(e.which === 3)
                {
                    // 这里如果使用this会调用到这个函数本身, 如果想要调用到这个类, 要在外面先存一下(outer)
                    outer.move_to(e.clientX, e.clientY);
                }
                else if(e.which === 1)
                {
                    if(outer.cur_skill === "fireball")
                    {
                        outer.shoot_fireball(e.clientX, e.clientY);
                    }
                }
            }
        );

        $(window).keydown( // 得到键盘按键
            function(e) {
                if(e.which === 81) // q 键
                {
                    outer.cur_skill = "fireball";
                    return false;
                }
                else if(e.which === 83)
                {
                    outer.move_length = 0;
                    return false;
                }
            }
        );
    }

    shoot_fireball(tx, ty)
    {
        let x = this.x, y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01);

        this.cur_skill = null;
    }

    get_dist(x1, y1, x2, y2)
    {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty)
    {
        this.move_length = this.get_dist(this.x, this.y, tx, ty); // 距离
        let angle = Math.atan2(ty - this.y, tx - this.x); // 角度

        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(angle, damage)
    {
        this.radius -= damage;
        if(this.radius < 10)
        {
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;

    }

    update()
    {
        if(this.damage_speed > this.eps)
        {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
        }
        else
        {
            if(this.move_length < this.eps) // 要移动的距离走完就停下
            {
                this.move_length = 0;
                this.vx = this.vy = 0;
                if(!this.is_me)
                {
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
                    this.move_to(tx, ty);
                }
            }
            else
            {
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000); // 当前这一帧移动了的距离, min函数防止最后一点多走了
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                this.move_length -= moved; // 更新还要移动的距离
            }
        }
        this.render();
    }

    render()
    {
        // 画一个圆表示玩家
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
