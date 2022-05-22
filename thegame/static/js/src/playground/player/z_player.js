class Player extends AcGameObject
{
    constructor(playground, x, y, radius, color, speed, character, username, photo)
    {
        // playground 地图
        // x, y 坐标
        // radius 球的半径 color 球的颜色
        // speed 每秒钟移动百分之多少 (在不同分辨率下时速度看起来一致, 所以用百分比速度)
        // character 判断角色


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
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01; //因为涉及浮点运算, 所以规定一个极小值
        this.friction = 0.9;
        this.spent_time = 0; // 从开始到此刻经过的时间

        this.cur_skill = null; // 当前选择的技能是什么

        if(this.character !== "robot") // 除了机器人外都有头像
        {
            this.img = new Image();
            this.img.src = this.photo;
        }

    }

    start()
    {
        if(this.character === "me")
        {
            this.add_listening_events();
        }
        else if(this.character === "robot")
        {
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
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
                const rect = outer.ctx.canvas.getBoundingClientRect();
                if(e.which === 3)
                {
                    // 这里如果使用this会调用到这个函数本身, 如果想要调用到这个类, 要在外面先存一下(outer)
                    outer.move_to((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                }
                else if(e.which === 1)
                {
                    if(outer.cur_skill === "fireball")
                    {
                        outer.shoot_fireball((e.clientX - rect.left) / outer.playground.scale, (e.clientY - rect.top) / outer.playground.scale);
                    }

                    outer.cur_skill = null;
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
        let radius = this.playground.height * 0.01 / this.playground.scale;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5 / this.playground.scale;
        let move_length = this.playground.height * 1 / this.playground.scale;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01 / this.playground.scale);

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
        for(let i = 0; i < 20; i ++) // 每次循环生成一个粒子
        {
            let x = this.x, y = this.y;
            let radius = this.radius *  Math.random() * 0.2; // 半径随机
            let angle = Math.PI * 2 * Math.random(); // 角度随机
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let color = this.color; // 颜色与球的颜色相同
            //console.log("球的颜色" + thecolor);
            let speed = this.speed * 10;
            let move_length = this.radius * Math.random() * 5; // 移动距离随机
            new Particle(this.playground, x, y, radius, vx, vy, color, speed, move_length);
        }

        this.radius -= damage;
        if(this.radius < this.eps)
        {
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
        this.speed *= this.friction;

    }

    update()
    {
        this.update_move();
        this.render();
    }


    update_move()
    {
        this.spent_time += this.timedelta / 1000;
        let players = this.playground.players;
        if(this.character === "robot" && this.spent_time > 5 && Math.random() < 1 / 360.0)
        {
            let player = this.playground.players[Math.floor(Math.random() * players.length)];
            this.shoot_fireball(player.x, player.y);
        }

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
                if(this.character === "robot")
                {
                    let tx = Math.random() * this.playground.width / this.playground.scale;
                    let ty = Math.random() * this.playground.height / this.playground.scale;
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
    }

    render()
    {
        let scale = this.playground.scale;
        if(this.character !== "robot") // 除了机器人外渲染头像
        {
            // 画头像
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale); 
            this.ctx.restore();
        }
        else
        {
            // 画一个圆表示玩家
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    on_destroy()
    {
        
        let players = this.playground.players;
        for(let i = 0; i < players.length; i ++)
        {
            if(players[i] === this)
            {
                players.splice(i, 1);
                break;
            }
        }
    }

}
