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

    show() { // 打开playground界面
        this.$playground.show();
        this.root.$ac_game.append(this.$playground);
        this.resize(); // 获取16：9的width和height
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new Player(this, this.width / 2 / this.scale, this.height / 2 / this.scale, this.height * 0.05 / this.scale, "white", this.height * 0.15 / this.scale, true));

        for(let i = 0; i < 5; i ++)
        {
            this.players.push(new Player(this, this.width / 2 / this.scale, this.height / 2 / this.scale, this.height * 0.05 / this.scale, this.get_random_color(), this.height * 0.15 / this.scale, false));
        }

    }

    hide() { // 关闭playground界面
        this.$playground.hide();
    }
}
