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

        this.$input.keydown(function(e) {
            if(e.which === 27) // esc
            {
                // 退出输入框时, 三秒后关闭历史记录, 并清除输入框
                outer.hide_input();
                outer.hide_history();
                outer.$input.val("");
                return false;
            }

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
                return false;
            }
        });
    }

    MessageToHtml(message)
    {
        return $(`<div>${message}</div>`);
    }

    add_message(username, text)
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

    show_input()
    {
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input()
    {
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}
