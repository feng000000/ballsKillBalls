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

        this.fireballs = [];

        if(this.character !== "robot") // 除了机器人外都有头像
        {
            this.img = new Image();
            this.img.src = this.photo;
        }

        if(this.character === "me")
        {
            this.fireball_coldtime = 3; // 单位是秒
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.flash_coldtime = 5;
            this.flash_img = new Image();
            this.flash_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }

    }

    start()
    {
        this.playground.player_count ++;
        this.playground.notice_board.write("已就绪：" + this.playground.player_count + "人");

        if(this.playground.player_count >= 3)
        {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting");
        }

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
                if(outer.playground.state != "fighting")
                    return false;

                const rect = outer.ctx.canvas.getBoundingClientRect();
                if(e.which === 3) {
                    // 这里如果使用this会调用到这个函数本身, 如果想要调用到这个类, 要在外面先存一下(outer)
                    let tx = (e.clientX - rect.left) / outer.playground.scale;
                    let ty = (e.clientY - rect.top) / outer.playground.scale;
                    outer.move_to(tx, ty);

                    if(outer.playground.mode === "multi mode")
                    {
                        outer.playground.mps.send_move_to(tx, ty);
                    }

                } else if(e.which === 1) {
                    let tx = (e.clientX - rect.left) / outer.playground.scale;
                    let ty = (e.clientY - rect.top) / outer.playground.scale;
                    if(outer.cur_skill === "fireball")
                    {
                        let fireball = outer.shoot_fireball(tx, ty);

                        if(outer.playground.mode === "multi mode")
                            outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                    }
                    else if(outer.cur_skill === "flash")
                    {
                        outer.flash(tx, ty);

                        if(outer.playground.mode === "multi mode")
                            outer.playground.mps.send_flash(tx, ty);
                    }

                    outer.cur_skill = null;
                }
            }
        );

        this.playground.game_map.$canvas.keydown( // 得到键盘按键
            function(e) {
                if(e.which === 13) // enter
                {
                    outer.playground.talk_window.show_input();
                }

                if(e.which === 27) // esc
                {
                    outer.playground.talk_window.hide_input();
                    outer.playground.talk_window.hide_history();
                }

                if(outer.playground.state != "fighting")
                    return true;

                if(e.which === 81) // q 键
                {
                    if(outer.fireball_coldtime > outer.eps)
                        return false;


                    outer.cur_skill = "fireball";
                    return false;
                }
                else if(e.which === 83)
                {
                    outer.stop_move();

                    if(outer.playground.mode === "multi mode")
                        outer.playground.mps.send_stop_move(outer.uuid);

                    return false;
                }
                else if(e.which === 68) // d
                {
                    if(outer.flash_coldtime > outer.eps)
                        return false;

                    outer.cur_skill = "flash";
                    return false;
                }
            }
        );
    }

    stop_move()
    {
        this.move_length = 0;
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
        let fireball = new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01 / this.playground.scale);

        this.fireballs.push(fireball);

        this.fireball_coldtime = 3;

        return fireball;
    }

    flash(tx, ty)
    {
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.3);
        // console.log("d == ", d);

        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += d * Math.cos(angle);
        this.y += d * Math.sin(angle);

        this.flash_coldtime = 5;
    }

    destroy_fireball(uuid)
    {
        for(let i = 0; i < this.fireballs.length; i ++)
        {
            let fireball = this.fireballs[i];
            if(fireball.uuid === uuid)
            {
                fireball.destroy();
                break;
            }
        }
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

    receive_attack(x, y, angle, damage, ball_uuid, attacker)
    {
        attacker.destroy_fireball(ball_uuid);
        this.x = x; // 同步坐标
        this.y = y;
        this.is_attacked(angle, damage);
    }

    update()
    {
        this.spent_time += this.timedelta / 1000;

        if(this.character === "me" && this.playground.state === "fighting")
            this.update_coldtime();

        this.update_move();

        this.render();
    }

    update_coldtime()
    {
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);

        this.flash_coldtime -= this.timedelta / 1000;
        this.flash_coldtime = Math.max(this.flash_coldtime, 0);
    }


    update_move()
    {
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

        if(this.character === "me" && this.playground.state === "fighting")
        {
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime()
    {
        // 画技能图标
        let scale = this.playground.scale;
        let x = 1.5;
        let y = 0.9;
        let radius = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - radius) * scale, (y - radius) * scale, radius * 2 * scale, radius * 2 * scale); 
        this.ctx.restore();

        // 画半透明的圆覆盖技能图标来表示cd
        if(this.fireball_coldtime > this.eps)
        {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);// 设置起点为圆心
            this.ctx.arc(x * scale, y * scale, radius * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 3) - Math.PI / 2, true); // 画圆弧
            this.ctx.lineTo(x * scale, y * scale); // 连接圆心和圆弧末端
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
            this.ctx.fill();
        }


        x = 1.62;
        y = 0.9;
        radius = 0.04;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.flash_img, (x - radius) * scale, (y - radius) * scale, radius * 2 * scale, radius * 2 * scale); 
        this.ctx.restore();

        if(this.flash_coldtime > this.eps)
        {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);// 设置起点为圆心
            this.ctx.arc(x * scale, y * scale, radius * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.flash_coldtime / 5) - Math.PI / 2, true); // 画圆弧
            this.ctx.lineTo(x * scale, y * scale); // 连接圆心和圆弧末端
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
            this.ctx.fill();
        }
    }

    on_destroy()
    {
        if(this.character === "me")
        {
            this.playground.state = "over";
        }

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
