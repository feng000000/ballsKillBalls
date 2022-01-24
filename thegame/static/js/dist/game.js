class AcGameMenu {
    constructor(root) {
        this.root = root; // this 为当前这个对象, root为当前对象下所有元素的根
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
        this.add_listening_events(); // 监听事件
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){ // 鼠标点击事件
            outer.hide(); // 隐藏menu
            outer.root.playground.show(); // 显示playground
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
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div>游戏界面</div>`);
        
        this.hide(); // 游戏界面创建出来时先关闭
        this.root.$ac_game.append(this.$playground); // append 在$ac_game末尾(仍然在内部)插入内容(playground)

        this.start();
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
class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id); // 得到id
        this.menu = new AcGameMenu(this); // 创建menu实例
        this.playground = new AcGamePlayground(this); // 创建playground实例

        this.start();
    }

    start() {
    }
}
