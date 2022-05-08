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
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}

