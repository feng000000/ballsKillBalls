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


}
