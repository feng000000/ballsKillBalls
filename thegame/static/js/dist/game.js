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
            设置
        </div>
    </div>
</div>
`);
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
            outer.root.playground.show();
        });
        this.$multi_mode.click(function(){
            console.log("click multi mode");
        });
        this.$settings.click(function(){
            console.log("click settings");
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
let AC_GAME_ANIMATION = function(timestamp) 
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
            obj.update();
        }
    }
    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION);
}

requestAnimationFrame(AC_GAME_ANIMATION);
class GameMap extends AcGameObject
{
    constructor(playground)
    {
        super(); // 调用基类的构造函数
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`); // 画布
        this.ctx = this.$canvas[0].getContext('2d'); // 用ctx去操作画布
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start()
    {

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
        this.eps = 3;
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillstyle = this.color;
        this.ctx.fill();

    }
}
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
        this.spent_time = 0; // 从开始到此刻经过的时间

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
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, this.playground.height * 0.01);

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
        if(this.radius < 10)
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
        this.spent_time += this.timedelta / 1000;
        let players = this.playground.players;
        if(!this.is_me && this.spent_time > 5 && Math.random() < 1 / 360.0)
        {
            let player = this.playground.players[Math.floor(Math.random() * players.length)];
            this.shoot_fireball(player.x, player.y);
        }

        if(this.damage_speed > 10)
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
        this.eps = 0.1;
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

        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        this.move_length -= moved;

        for(let i = 0; i < this.playground.players.length; i ++)
        {
            let player = this.playground.players[i];
            if(this.player !== player && this.is_conllision(player))
            {
                this.attack(player);
            }
        }

        this.render();
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
        this.destroy();
    }

    render()
    {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}

class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);
        
        // this.hide();
        this.root.$ac_game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, "white", this.height * 0.15, true));

        for(let i = 0; i < 5; i ++)
        {
            this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, this.get_random_color(), this.height * 0.15, false));
        }


        this.start();
    }

    get_random_color()
    {
        let colors = ["blue", "red", "pink", "grey", "green"];
        return colors[Math.floor(Math.random() * 5)];
    }

    start() {
    }

    update() {
    }

    show() { // 打开playground界面
        this.$playground.show();
    }

    hide() { // 关闭playground界面
        this.$playground.hide();
    }
}
export class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id);
        // this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}
