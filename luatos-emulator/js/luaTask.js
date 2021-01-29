var LuaTaskObject
class LuaTask {
    L;
    timerPool = {};
    print;//给类内部使用的函数输出函数
    startTask = false;
    stop = false;//是否已结束运行？

    constructor() {
        this.L = fengari.lauxlib.luaL_newstate();
        fengari.lualib.luaL_openlibs(this.L);
        fengari.lauxlib.luaL_requiref(this.L, fengari.to_luastring("js"), fengari.interop.luaopen_js, 1);
        this.bindFn(this.luaStartTimer,"sysLuaStartTimer");
        this.bindFn(this.luaStopTimer,"sysLuaStopTimer");
        LuaTaskObject = this;
    }

    //绑定一个函数到某名字
    bindFn(fn,name) {
        fengari.lua.lua_pushjsfunction(this.L, fn);
        fengari.lua.lua_setglobal(this.L, fengari.to_luastring(name));
    }

    //启动定时器
    //需要给lua返回一个timer id
    luaStartTimer(L) {
        var id = fengari.lua.lua_tointeger(L,1);
        var ms = fengari.lua.lua_tointeger(L,2);
        var timer = setTimeout((L) => {
            fengari.lua.lua_getglobal(L, fengari.to_luastring("sysTriggerCB"));
            fengari.lua.lua_pushinteger(L, id);
            fengari.lua.lua_pushstring(L, fengari.to_luastring("timer"));
            fengari.lua.lua_pushstring(L, fengari.to_luastring(""));
            if(fengari.lua.lua_pcall(L,3,0,0))
            {
                LuaTaskObject.print("lua timer 回调报错：");
                LuaTaskObject.print(fengari.lua.lua_tojsstring(LuaTaskObject.L, -1));
            }
        }, ms,L);
        LuaTaskObject.timerPool[id] = {
            type: "timer",
            timer: timer,
        };
        fengari.lua.lua_pushinteger(L, 1);
        return 1;
    };
    //停止lua定时器
    luaStopTimer(L) {
        var id = fengari.lua.lua_tointeger(L,1);
        clearTimeout(LuaTaskObject.timerPool[id].timer);
        delete LuaTaskObject.timerPool[id];
        return 0;
    };

    trigger(id,text){
        fengari.lua.lua_getglobal(this.L, fengari.to_luastring("sysTriggerCB"));
        fengari.lua.lua_pushinteger(this.L, id);
        fengari.lua.lua_pushstring(this.L, fengari.to_luastring("function"));
        fengari.lua.lua_pushstring(this.L, fengari.to_luastring(text));
        if(fengari.lua.lua_pcall(this.L,3,0,0))
        {
            this.print("lua trigger 回调报错：");
            this.print(fengari.lua.lua_tojsstring(this.L, -1));
        }
    }

    doString(s) {
        var r = fengari.lauxlib.luaL_dostring(this.L,fengari.to_luastring(s));
        if(r){
            var err = fengari.lua.lua_tojsstring(this.L, -1);
            return {success:false,error:err};
        }
        else{
            return {success:true,error:""};
        }
    }

    //回收lua对象，关闭所有timer，不用的时候要调用这个释放资源
    clean() {
        stop = true;
        for(var i in LuaTaskObject.timerPool)
        {
            clearTimeout(LuaTaskObject.timerPool[i].timer);
            delete LuaTaskObject.timerPool[i];
        }
        fengari.lua.lua_close(this.L);
    }
}
