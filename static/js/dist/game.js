class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        <br>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        <br>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
`);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.settings.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function(){
            outer.hide();
            outer.root.settings.hide();
            outer.root.playground.show("multi mode");
        });
        this.$settings.click(function(){
            console.log("click settings");
            outer.root.settings.logout_on_remote();
        });
    }

    show() { // 显示menu界面
        this.$menu.show();
    }

    hide() { // 关闭menu界面
        this.$menu.hide();
    }
}
let AC_GAME_OBJECTS = [];

class AcGameObject 
{
    constructor()
    {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false; // 是否执行过start函数
        this.timedelta = 0; // 当前帧距离上一帧的时间间隔, 单位为ms
        // 因为不同浏览器刷新率可能不一样, 
        // 所以这里记录时间间隔来设置速度, 让所有浏览器下物体速度都一致

        this.uuid = this.create_uuid();

    }

    create_uuid()
    {
        let res = "";
        for(let i = 0; i < 8; i ++)
        {
            let x = Math.floor(Math.random() * 10);
            res += x;
        }

        return res;
    }

    start() // 只会在第一帧执行
    {

    }

    update() //  每一帧均会执行一次
    {

    }

    on_destroy() // 在被销毁前执行一次
    {

    }

    destroy() // 删掉该物体
    {
        this.on_destroy();

        for(let i = 0; i < AC_GAME_OBJECTS.length; i ++)
        {
            if(AC_GAME_OBJECTS[i] === this)
            {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }

}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp) // 实现动画
{
    for(let i = 0; i < AC_GAME_OBJECTS.length; i ++)
    {
        let obj = AC_GAME_OBJECTS[i];
        if(!obj.has_called_start)
        {
            obj.start();
            obj.has_called_start = true;
        }
        else
        {
            obj.timedelta = timestamp - last_timestamp;
            obj.update(); // 更新画面
        }
    }
    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION); // 递归掉用
}

requestAnimationFrame(AC_GAME_ANIMATION); // 调用一次即可实现循环
class GameMap extends AcGameObject
{
    constructor(playground)
    {
        super(); // 调用基类的构造函数
        this.playground = playground;
        this.$canvas = $(`<canvas tabindex=0 ></canvas>`); // 画布
        this.ctx = this.$canvas[0].getContext('2d'); // 用ctx去操作画布
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start()
    {
        this.$canvas.focus();
    }

    resize()
    {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)"; // 画一层不透明层, 这样改变窗口时背景颜色不会渐变
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    update()
    {
        this.render();
    }

    render() // 渲染
    {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)"; 
        // 三个零分别表示 红蓝绿 三种颜色的量, 还可以再加第四个值表示不透明度, 
        // 半透明的背景会导致玩家移动时会有一定的残影, (因为之前帧的玩家影像没有被完全覆盖住)
        // 可以为 0-255的整数 或者 0%-100%的百分数

        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height); // 画出这个矩形
    }
}
class NoticeBoard extends AcGameObject
{
    constructor(playground)
    {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "已就绪：0人";

    }

    start()
    {

    }

    write(text)
    {
        this.text = text;
    }

    update()
    {
        this.render();
    }

    render()
    {
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
class Particle extends AcGameObject
{
    constructor(playground, x, y, radius, vx, vy, color, speed, move_length)
    {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        //console.log("传入粒子的颜色" + colorofPlayer);
        this.speed = speed;
        this.move_length = move_length;
        this.friction = 0.9;
        this.eps = 0.01;
    }

    start()
    {
    }

    update()
    {
        if(this.move_length < this.eps || this.speed < this.eps)
        {
            //console.log("粒子: 粒子的颜色" + this.colorofParticle);
            this.destroy();
            return false;
        }

        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.speed *= this.friction;
        this.move_length -= moved;
        this.render();
    }

    render()
    {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();

    }
}
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
class FireBall extends AcGameObject
{
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage)
    {
        super();

        this.playground = playground;
        this.player = player;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length; // 射程
        this.damage = damage;
        this.eps = 0.01;
    }

    start()
    {

    }

    update()
    {
        if(this.move_length < this.eps)
        {
            this.destroy();
            return false;
        }

        this.update_move();

        if(this.player.character !== "enemy") // 如果是敌人, 就不判断碰撞, 敌人的炮弹只是动画, 碰撞只由发出碰撞的窗口判断
        {
            this.update_attack();
        }

        this.render();
    }

    update_move()
    {
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;
    }


    update_attack()
    {
        for(let i = 0; i < this.playground.players.length; i ++)
        {
            let player = this.playground.players[i];
            if(this.player !== player && this.is_conllision(player))
            {
                this.attack(player);
                break;
            }
        }
    }


    get_dist(x1, y1, x2, y2)
    {
        let dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_conllision(player) // 判断火球是否与player这个玩家（保证不是自己）发生碰撞
    {
        let distance = this.get_dist(this.x, this.y, player.x, player.y); // 距离player的距离
        if(distance < this.radius + player.radius)
            return true;
        return false;
    }

    attack(player) // 和player发生碰撞
    {
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage)

        if(this.playground.mode === "multi mode")
        {
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
        }


        this.destroy();
    }

    render()
    {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy()
    {
        let fireballs = this.player.fireballs;
        for(let i = 0; i < fireballs.length; i ++)
        {
            if(fireballs[i] === this)
            {
                fireballs.splice(i, 1);
                break;
            }
        }
    }

}

class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;

        // console.log("make a Websocket");
        this.ws = new WebSocket("wss://app1793.acapp.acwing.com.cn/wss/multiplayer/"); // 建立连接
        this.start();
    }

    start() {
        this.receive();
    }

    receive() { // 接受后端传回前端的信息
        let outer = this;

        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            if(uuid === outer.uuid) return false;

            let event = data.event;
            if(event === "create_player")
            {
                outer.receive_create_player(uuid, data.username, data.photo);
            }
            else if(event === "move_to")
            {
                outer.receive_move_to(uuid, data.tx, data.ty);
            }
            else if(event === "shoot_fireball")
            {
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.fireball_uuid);
            }
            else if(event === "stop_move")
            {
                outer.receive_stop_move(uuid);
            }
            else if(event === "attack")
            {
                outer.receive_attack(uuid, data.attacked_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            }
            else if(event === "flash")
            {
                outer.receive_flash(uuid, data.tx, data.ty);
            }
            else if(event === "message")
            {
                outer.receive_message(data.username, data.text);
            }
        };
    }

    get_player(uuid)
    {
        let players = this.playground.players;
        for(let i = 0; i < players.length; i ++)
        {
            let player = players[i];
            if(player.uuid === uuid)
                return player;
        }

        return null;
    }

    destroy_fireball(uuid)
    {
        for(let i = 0; i < this.fireballs.length; i ++)
        {
            let fireball = this.fireballs[i];
            if(fireball.uuid === uuid)
            {
                firevall.destroy();
                break;
            }
        }
    }

    send_create_player(username, photo) { // 向后端发送创建玩家的请求
        let outer = this;
        this.ws.send(JSON.stringify({ // JSON.stringify() 将json封装成字符串
            'event': "create_player",
            'uuid': outer.uuid,
            'username': username,
            'photo': photo,
        }));
    }

    receive_create_player(uuid, username, photo) { // 接受后端创建玩家的请求
        let width = this.playground.width;
        let height = this.playground.height;
        let scale = this.playground.scale;
        let player = new Player(
            this.playground,
            width / 2 / scale,
            height / 2 / scale,
            height * 0.05 / scale,
            "white",
            height * 0.15 / scale,
            "enemy",
            username,
            photo,
        );

        player.uuid = uuid;
        this.playground.players.push(player);
    }

    send_move_to(tx, ty)
    {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "move_to",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_move_to(uuid, tx, ty)
    {
        let player = this.get_player(uuid);

        if(player)
        {
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball(tx, ty, fireball_uuid)
    {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "shoot_fireball",
            'uuid': outer.uuid,
            'tx': tx,
            'ty': ty,
            'fireball_uuid': fireball_uuid,
        }));
    }

    receive_shoot_fireball(uuid, tx, ty, fireball_uuid)
    {
        let player = this.get_player(uuid);
        if(player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = fireball_uuid;
        }
    }


    send_stop_move(uuid)
    {
        this.ws.send(JSON.stringify({
            'event': "stop_move",
            'uuid': uuid,
        }));
    }

    receive_stop_move(uuid)
    {
        let player = this.get_player(uuid);

        // console.log(uuid, this.uuid);

        if(player)
        {
            player.stop_move();
        }
    }

    // 每次攻击同步一下attacked(被击中玩家)的位置来修正误差
    send_attack(attacked_uuid, x, y, angle, damage, ball_uuid )
    {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "attack",
            'uuid': outer.uuid,
            'attacked_uuid': attacked_uuid,
            'x': x,
            'y': y,
            'angle': angle,
            'damage': damage,
            'ball_uuid': ball_uuid,
        }));
    }

    receive_attack(uuid, attacked_uuid, x, y, angle, damage, ball_uuid)
    {
        let attacker = this.get_player(uuid); // 攻击者
        let attacked = this.get_player(attacked_uuid); // 被攻击者

        if(attacker && attacked)
        {
            attacked.receive_attack(x, y, angle, damage, ball_uuid, attacker);
        }

    }

    send_flash(tx, ty)
    {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "flash",
            'uuid' : outer.uuid,
            'tx': tx,
            'ty': ty,
        }));
    }

    receive_flash(uuid, tx, ty)
    {
        let player = this.get_player(uuid);

        if(player)
        {
            player.flash(tx, ty);
        }
    }

    send_message(username, text)
    {
        let outer = this;
        this.ws.send(JSON.stringify({
            'event': "message",
            'uuid': outer.uuid,
            'username': username,
            'text': text,
        }));
    }

    receive_message(username, text)
    {
        this.playground.talk_window.add_message(username, text);
    }

}
class TalkWindow
{
    constructor(playground)
    {
        this.playground = playground;

        this.$talk_history = $(`<div class="ac-game-talk-window-history">历史记录</div>`);
        this.$input = $(`<input type="text" class="ac-game-talk-window-input">`);

        this.$talk_history.hide();
        this.$input.hide();

        this.playground.$playground.append(this.$talk_history);
        this.playground.$playground.append(this.$input);

        this.func_id = null;


        this.start();
    }

    start()
    {
        this.add_listening();
    }

    add_listening()
    {
        let outer = this;

        this.$talk_history.on("contextmenu",function() {
            return false;
        });

        this.$input.keydown(function(e) {
            //if(e.which === 27) // esc
            //{
            //    // 退出输入框时, 三秒后关闭历史记录, 并清除输入框
            //    outer.hide_input();
            //    outer.hide_history();
            //    outer.$input.val("");
            //    return false;
            //}

            if(e.which === 13) // enter
            {
                // 发送消息后, 清空输入框
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if(text)
                {
                    outer.$input.val("");
                    outer.add_message(username, text);

                    if(outer.playground.mode === "multi mode")
                    {
                        outer.playground.mps.send_message(username, text);
                    }

                }

                outer.hide_input();
                return false;
            }
        });
    }

    MessageToHtml(message)
    {
        return $(`<div>${message}</div>`);
    }

    add_message(username, text) // 添加信息, 显示hitory, 3秒后关闭
    {
        let message = `[${username}]${text}`; // js语法, ``中可以取变量的值

        this.$talk_history.append(this.MessageToHtml(message));

        this.$talk_history.scrollTop(this.$talk_history[0].scrollHeight);
        // scrollTop() 可以设置滑动条到顶部的距离
        // scrollHeight是滑动条的总高度

        if(username !== this.playground.root.settings.username) // 如果不是自己发的信息, 那么要自动显示三秒钟
        {
            this.show_history();
            this.hide_history();
        }

    }

    show_history() // 展示历史记录, 不自动关闭
    {
        this.$talk_history.show();

        if(this.func_id) 
        {
            clearTimeout(this.func_id);
        }
    }

    hide_history() // 三秒后关闭历史记录
    {
        let outer = this;

        // if(this.func_id) clearTimeout(this.func_id);

        this.func_id = setTimeout( function() {
            outer.$talk_history.hide();
        }, 3000);
    }

    show_input() // 显示输入框
    {
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input() // 隐藏输入框
    {
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);

        this.hide();

        this.start();
    }

    get_random_color()
    {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * 5)];
    }

    start() 
    {
        let outer = this;

        outer.resize(); // 刚生成页面时调用一次

        $(window).resize(function() { // 之后每次窗口改变大小时调用一次
            outer.resize();
        });
    }

    resize()
    {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        let unit = Math.min(this.width / 16, this.height / 9); // 在16:9的比例下, 最小单位为unit, 取宽高比例换算后的较小值
        this.width = unit * 16;
        this.height = unit * 9;
        this.scale = this.height; // 用scale来表示其他的距离

        if(this.game_map) this.game_map.resize();
    }

    update() {
    }

    show(mode) { // 打开playground界面
        let outer = this;
        this.$playground.show();
        this.root.$ac_game.append(this.$playground);
        this.resize(); // 获取16：9的width和height
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new Player(
            this,
            this.width / 2 / this.scale,
            this.height / 2 / this.scale,
            this.height * 0.05 / this.scale,
            "white",
            this.height * 0.15 / this.scale,
            "me",
            this.root.settings.username,
            this.root.settings.photo,
        ));

        this.mode = mode;
        this.state = "wating"; // wating 匹配中, fighting 游戏中, over 死亡
        this.notice_board = new NoticeBoard(this);
        this.talk_window = new TalkWindow(this);
        this.player_count = 0;

        if(mode === "single mode")
        {
            for(let i = 0; i < 5; i ++)
            {
                this.players.push(new Player(
                    this,
                    this.width / 2 / this.scale,
                    this.height / 2 / this.scale,
                    this.height * 0.05 / this.scale,
                    this.get_random_color(),
                    this.height * 0.15 / this.scale,
                    "robot",
                ));
            }
        }
        else if(mode === "multi mode")
        {
            // console.log("new multiplayersocket");
            this.mps = new MultiPlayerSocket(this); // 建立连接
            this.mps.uuid = this.players[0].uuid;


            // 建立连接成功后发送创建玩家的请求
            this.mps.ws.onopen = function() { // 连接成功时会回调该函数 YourSocket.ws.onopen()
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            };

        }

    }

    hide() { // 关闭playground界面
        this.$playground.hide();
    }
}
class Settings
{
    constructor(root)
    {
        this.root = root;
        this.platform = "WEB";
        if(this.root.AcWingOS) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>

        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>

        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>

        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</botton>
            </div>
        </div>

        <div class="ac-game-settings-error-message">
        </div>

        <div class="ac-game-settings-option">
            注册
        </div>

        <br>

        <div class="ac-game-settings-acwinglogo">
            <img src="https://app1793.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>

    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>

        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>

        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>

        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="重复密码">
            </div>
        </div>

        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</botton>
            </div>
        </div>

        <div class="ac-game-settings-error-message">
        </div>

        <div class="ac-game-settings-option">
            登录
        </div>

        <br>

        <div class="ac-game-settings-acwinglogo">
            <img src="https://app1793.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
`);

        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();


        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_meesage = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");

        this.$register.hide();

        this.$acwing_login = this.$settings.find('.ac-game-settings-acwinglogo img');

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start()
    {
        if(this.platform === "ACAPP")
            this.getinfo_acapp();
        else
        {
            this.getinfo_web();
            this.add_listening();
        }
    }

    add_listening()
    {
        let outer = this;
        this.add_listening_login();
        this.add_listening_register();

        this.$acwing_login.click(function() {
            outer.acwing_login();
        });
    }

    acwing_login() 
    {
        $.ajax({
            url: "https://app1793.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp) {
                console.log(resp);
                if(resp.result === "success") 
                {
                    window.location.replace(resp.apply_code_url); // 页面重定向
                }
            }
        });
    }

    add_listening_login()
    {
        let outer = this;

        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        })
    }


    add_listening_register()
    {
        let outer = this;

        this.$register_login.click(function() {
            outer.login();
        });
        this.$register_submit.click(function() {
            outer.register_on_remote();
        });
    }

    login_on_remote()
    {
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url: "https://app1793.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                console.log(resp);
                if(resp.result === "success")
                    location.reload();
                else
                    outer.$login_error_message.html(resp.result);
            }
        });
    }

    logout_on_remote()
    {
        if(this.platform === "ACAPP")
        {
            this.root.AcWingOS.api.window.close(); // acwing提供的api
        }
        else
        {
            $.ajax({
                url: "https://app1793.acapp.acwing.com.cn/settings/logout/",
                type: "GET",
                success: function(resp) {
                    console.log(resp);
                    if(resp.result === "success")
                        location.reload(resp.apply_code_url); // 页面重定向
                }
            });
        }
    }

    register_on_remote()
    {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_meesage.empty();

        $.ajax({
            url: "https://app1793.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function(resp) {
                console.log(resp);
                if(resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_meesage.html(resp.result);
                }
            }
        })
    }

    login()
    { 
        // 打开登陆界面
        this.$register.hide();
        this.$login.show();
    }

    register() {
        this.$login.hide();
        this.$register.show();
    }


    acapp_login(appid, redirect_uri, scope, state)
    {
        let outer = this;

        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp) {
            if(resp.result === "success")
            {
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    getinfo_acapp()
    {
        let outer = this;

        $.ajax({
            url: "https://app1793.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp) {
                if(resp.result === "success")
                {
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }

            }
        });
    }


    getinfo_web() // 从客户端获取信息
    {
        let outer = this;
        $.ajax({
            url: "https://app1793.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform, 
            },
            success: function(resp) {
                console.log(resp);
                if(resp.result === "success") {
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.root.menu.show();
                }else {
                    outer.login();
                }
            }
        });
    }

    hide()
    {
        this.$settings.hide();
    }

    show()
    {
        this.settings.show();
    }

}
export class AcGame {
    constructor(id, AcWingOS) {
        this.id = id;
        this.$ac_game = $('#' + id);
        this.AcWingOS = AcWingOS;

        this.menu = new AcGameMenu(this);
        this.settings = new Settings(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}
