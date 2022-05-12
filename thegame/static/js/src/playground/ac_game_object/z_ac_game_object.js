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
let AC_GAME_ANIMATION = function(timestamp) // 实现动画
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
            obj.update(); // 更新画面
        }
    }
    last_timestamp = timestamp;

    requestAnimationFrame(AC_GAME_ANIMATION); // 递归掉用
}

requestAnimationFrame(AC_GAME_ANIMATION); // 调用一次即可实现循环
