var luaTask_L;
var luaTask_timerPool = {};
var luaTask_print;//给内部使用的函数输出函数
var luaTask_startTask = false;

//绑定一个函数到某名字
function luaTask_bindFn(fn,name) {
    fengari.lua.lua_pushjsfunction(luaTask_L, fn);
    fengari.lua.lua_setglobal(luaTask_L, fengari.to_luastring(name));
}

//启动定时器
//需要给lua返回一个timer id
function luaTask_luaStartTimer(L) {
    var id = fengari.lua.lua_tointeger(L,1);
    var ms = fengari.lua.lua_tointeger(L,2);
    var timer = setTimeout((L) => {
        fengari.lua.lua_getglobal(L, fengari.to_luastring("sysTriggerCB"));
        fengari.lua.lua_pushinteger(L, id);
        fengari.lua.lua_pushstring(L, fengari.to_luastring("timer"));
        fengari.lua.lua_pushstring(L, fengari.to_luastring(""));
        if(fengari.lua.lua_pcall(L,3,0,0))
        {
            console.log("lua timer 回调报错：");
            console.log(fengari.lua.lua_tojsstring(luaTask_L, -1));
        }
    }, ms,L);
    luaTask_timerPool[id] = {
        type: "timer",
        timer: timer,
    };
    fengari.lua.lua_pushinteger(L, 1);
    return 1;
}

//停止lua定时器
function luaTask_luaStopTimer(L) {
    var id = fengari.lua.lua_tointeger(L,1);
    clearTimeout(luaTask_timerPool[id].timer);
    delete luaTask_timerPool[id];
    return 0;
}

function luaTask_trigger(id,text){
    fengari.lua.lua_getglobal(luaTask_L, fengari.to_luastring("sysTriggerCB"));
    fengari.lua.lua_pushinteger(luaTask_L, id);
    fengari.lua.lua_pushstring(luaTask_L, fengari.to_luastring("function"));
    fengari.lua.lua_pushstring(luaTask_L, fengari.to_luastring(text));
    if(fengari.lua.lua_pcall(luaTask_L,3,0,0))
    {
        this.print("lua trigger 回调报错：");
        this.print(fengari.lua.lua_tojsstring(luaTask_L, -1));
    }
}

function luaTask_doString(s) {
    var r = fengari.lauxlib.luaL_dostring(luaTask_L,fengari.to_luastring(s));
    if(r){
        var err = fengari.lua.lua_tojsstring(luaTask_L, -1);
        return {success:false,error:err};
    }
    else{
        return {success:true,error:""};
    }
}


function luaTask_create() {
    luaTask_L = fengari.lauxlib.luaL_newstate();
    fengari.lualib.luaL_openlibs(luaTask_L);
    fengari.lauxlib.luaL_requiref(luaTask_L, fengari.to_luastring("js"), fengari.interop.luaopen_js, 1);
    luaTask_bindFn(luaTask_luaStartTimer,"sysLuaStartTimer");
    luaTask_bindFn(luaTask_luaStopTimer,"sysLuaStopTimer");
}

//回收lua对象，关闭所有timer，不用的时候要调用这个释放资源
function luaTask_clean() {
    if(typeof(luaTask_L) == "undefined")
        return;
    for(var i in luaTask_timerPool)
    {
        clearTimeout(luaTask_timerPool[i].timer);
        delete luaTask_timerPool[i];
    }
    fengari.lua.lua_close(luaTask_L);
}
