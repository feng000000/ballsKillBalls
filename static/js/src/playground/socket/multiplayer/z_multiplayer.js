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
            if(event === "create_player") {
                outer.receive_create_player(uuid, data.username, data.photo);
            }
        };
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
}
