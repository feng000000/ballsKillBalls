class Particle extends AcGameObject
{
    constructor(playground, x, y, radius, vx, vy, colorofPlayer, speed, move_length)
    {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = vx;
        this.vy = vy;
        this.colorofParticle = colorofPlayer;
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
        this.ctx.fillstyle = this.colorofParticle;
        this.ctx.fill();

    }
}
