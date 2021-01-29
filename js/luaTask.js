class LuaTask {
    L;
    constructor() {
        this.L = fengari.lauxlib.luaL_newstate();
        fengari.lualib.luaL_openlibs(this.L);
        fengari.lauxlib.luaL_requiref(this.L, fengari.to_luastring("js"), fengari.interop.luaopen_js, 1);
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

    clean() {
        fengari.lua.lua_close(this.L);
    }
}
