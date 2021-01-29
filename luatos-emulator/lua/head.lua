
JSONLIB = require("JSON")
utils = require("utils")

--加强随机数随机性
math.randomseed(tostring(os.time()):reverse():sub(1, 6))

json = {
    null = "\0",
    decode = function (s)--安全的，带解析结果返回的json解析函数
        local result, info = pcall(function(t) return JSONLIB:decode(t) end, s)
        if result then
            return info, true
        else
            return {}, false, info
        end
    end,
    encode = function (t)
        return JSONLIB:encode(t,nil,{null=json.null})
    end
}

loadstring = load

pack = {
    pack = string.pack,
    unpack = function (s,f,h)
        local t
        if h then
            t = table.pack(string.unpack(f,s:sub(h)))
        else
            t = table.pack(string.unpack(f,s))
        end
        table.insert(t,1,table.remove(t,#t))
        return table.unpack(t)
    end,
}

unpack = table.unpack

BIT = require("bit")
bit = BIT.bit32
bit.bit = function(b) return bit.lshift(1,b) end
bit.isset = function(v,p) return bit.rshift(v,p) % 2 == 1 end
bit.isclear = function(v,p) return not bit.isset(v,p) end

nvm = require("nvm")

local LEVEL_TAG = {'T', 'D', 'I', 'W', 'E', 'F'}
local function _log(level, tag, ...)
    local OPEN_LEVEL = LOG_LEVEL or 3
    -- 如果日志级别为静默，或设定级别更高，则不输出日志
    if OPEN_LEVEL == 0 or OPEN_LEVEL > level then return end
    local prefix = string.format("[%s]-[%s]", LEVEL_TAG[level], type(tag)=="string" and tag or "")
    print(prefix,...)
end

log = {
    trace = function(tag, ...) _log(1, tag, ...) end,
    debug = function(tag, ...) _log(2, tag, ...) end,
    info = function(tag, ...) _log(3, tag, ...) end,
    warn = function(tag, ...) _log(4, tag, ...) end,
    error = function(tag, ...) _log(5, tag, ...) end,
    fatal = function(tag, ...) _log(6, tag, ...) end,
}

misc = require("misc")

sys = require("sys")
