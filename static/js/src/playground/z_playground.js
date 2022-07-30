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

    create_uuid()
    {
        let res = "";
        for(let i = 0; i < 8; i ++)
        {
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }
        return res;
    }

    start() 
    {
        let outer = this;
        let uuid = this.create_uuid();
        this.resize(); // 刚生成页面时调用一次

        $(window).on(`resize.${uuid}`, function() { // 之后每次窗口改变大小时调用一次
            //console.log("resize");
            outer.resize();
        });

        if(this.root.AcWingOS)
        {
            this.root.AcWingOS.api.window.on_close(function() { // acwing提供的api
                $(window).off(`resize.${uuid}`);
            });
        }
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
        this.score_board = new ScoreBoard(this);
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

        // 隐藏玩家
        // 因为刚开始创建playground时就调用了hide()函数, 所以只有在玩家存在时才会是游戏结束的情况, 此时再隐藏所有东西
        while(this.players && this.players.length > 0)
        {
            this.players[0].destroy();
        }

        // 隐藏游戏地图
        if(this.game_map)
        {
            this.game_map.destroy();
            this.game_map = null;
        }

        // 删除notice_board
        if(this.notice_board)
        {
            this.notice_board.destroy();
            this.notice_board = null;
        }

        // 删除score_board
        if(this.score_board)
        {
            this.score_board.destroy();
            this.score_board = null;
        }

        // 清空html
        this.$playground.empty();


        this.$playground.hide();
    }
}
