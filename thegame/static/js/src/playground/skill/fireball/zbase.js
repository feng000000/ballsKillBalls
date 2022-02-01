class FireBall extends AcGameObject
{
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length)
    {
        this.playground = playground;
        this.player = player;
        this.ctx = this.palyground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length; // 射程
        this.eps = 0.1;
    }

    start()
    {

    }

    update()
    {
        this.render();
    }
    
    render()
    {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius. 0, Math.PI * 2. false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

}

