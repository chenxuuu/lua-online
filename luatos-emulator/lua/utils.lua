--- 模块功能：常用工具类接口
-- @module utils
-- @author openLuat
-- @license MIT
-- @copyright openLuat
-- @release 2017.10.19

--- 将Lua字符串转成HEX字符串，如"123abc"转为"313233616263"
-- @string str 输入字符串
-- @string[opt=""] separator 输出的16进制字符串分隔符
-- @return hexstring 16进制组成的串
-- @return len 输入的字符串长度
-- @usage
-- string.toHex("\1\2\3") -> "010203" 3
-- string.toHex("123abc") -> "313233616263" 6
-- string.toHex("123abc"," ") -> "31 32 33 61 62 63 " 6
function string.toHex(str, separator)
    return str:gsub('.', function(c)
        return string.format("%02X" .. (separator or ""), string.byte(c))
    end)
end
--- 将HEX字符串转成Lua字符串，如"313233616263"转为"123abc", 函数里加入了过滤分隔符，可以过滤掉大部分分隔符（可参见正则表达式中\s和\p的范围）。
-- @string hex,16进制组成的串
-- @return charstring,字符组成的串
-- @return len,输出字符串的长度
-- @usage
-- string.fromHex("010203")       ->  "\1\2\3"
-- string.fromHex("313233616263") ->  "123abc"
function string.fromHex(hex)
    --滤掉分隔符
    local hex = hex:gsub("[%s%p]", ""):upper()
    return hex:gsub("%x%x", function(c)
        return string.char(tonumber(c, 16))
    end)
end

--- 返回字符串tonumber的转义字符串(用来支持超过31位整数的转换)
-- @string str 输入字符串
-- @return str 转换后的lua 二进制字符串
-- @return len 转换了多少个字符
-- @usage
-- string.toValue("123456") -> "\1\2\3\4\5\6"  6
-- string.toValue("123abc") -> "\1\2\3\a\b\c"  6
function string.toValue(str)
    return string.fromHex(str:gsub("%x", "0%1"))
end

--- 返回utf8编码字符串的长度
-- @string str,utf8编码的字符串,支持中文
-- @return number,返回字符串长度
-- @usage local cnt = string.utf8Len("中国a"),cnt == 3
function string.utf8Len(str)
    local _, count = string.gsub(str, "[^\128-\193]", "")
    return count
end

--- 返回utf8编码字符串的单个utf8字符的table
-- @string str，utf8编码的字符串,支持中文
-- @return table,utf8字符串的table
-- @usage local t = string.utf8ToTable("中国2018")
function string.utf8ToTable(str)
    local tab = {}
    for uchar in string.gmatch(str, "[%z\1-\127\194-\244][\128-\191]*") do
        tab[#tab + 1] = uchar
    end
    return tab
end

--- 返回字符串的 RFC3986 编码
-- @string str，要转换编码的字符串,支持UTF8编码中文
-- @return str, RFC3986 编码的字符串
-- @usage local str = string.rawurlEncode("####133") ,str == "%23%23%23%23133"
-- @usage local str = string.rawurlEncode("中国2018") , str == "%e4%b8%ad%e5%9b%bd2018"
function string.rawurlEncode(str)
    local t = str:utf8ToTable()
    for i = 1, #t do
        if #t[i] == 1 then
            t[i] = string.gsub(string.gsub(t[i], "([^%w_%~%.%- ])", function(c) return string.format("%%%02X", string.byte(c)) end), " ", "%%20")
        else
            t[i] = string.gsub(t[i], ".", function(c) return string.format("%%%02X", string.byte(c)) end)
        end
    end
    return table.concat(t)
end

--- 返回字符串的urlEncode编码
-- @string str，要转换编码的字符串,支持UTF8编码中文
-- @return str,urlEncode编码的字符串
-- @usage local str = string.urlEncode("####133") ,str == "%23%23%23%23133"
-- @usage local str = string.urlEncode("中国2018") , str == "%e4%b8%ad%e5%9b%bd2018"
function string.urlEncode(str)
    local t = str:utf8ToTable()
    for i = 1, #t do
        if #t[i] == 1 then
            t[i] = string.gsub(string.gsub(t[i], "([^%w_%*%.%- ])", function(c) return string.format("%%%02X", string.byte(c)) end), " ", "+")
        else
            t[i] = string.gsub(t[i], ".", function(c) return string.format("%%%02X", string.byte(c)) end)
        end
    end
    return table.concat(t)
end

--- 返回一个迭代器函数,每次调用函数都会返回hash表的排序后的键值对
-- @table t, 要排序的hash表
-- @param f, 自定义排序函数
-- @return function.
-- @usage test = {a=1,f=9,d=2,c=8,b=5}
-- @usage for name,line in pairsByKeys(test) do print(name,line) end
function table.gsort(t, f)
    local a = {}
    for n in pairs(t) do a[#a + 1] = n end
    table.sort(a, f)
    local i = 0
    return function()
        i = i + 1
        return a[i], t[a[i]]
    end
end

--- table.concat的增强版，支持嵌套字符串数组
-- @table l,嵌套字符串数组
-- @return string
-- @usage  print(table.rconcat({"a",{" nice "}," and ", {{" long "},{" list "}}}))
function table.rconcat(l)
    if type(l) ~= "table" then return l end
    local res = {}
    for i = 1, #l do
        res[i] = rconcat(l[i])
    end
    return table.concat(res)
end

--- 返回数字的千位符号格式
-- @number num,数字
-- @return string，千位符号的数字字符串
-- @usage loca s = string.formatNumberThousands(1000) ,s = "1,000"
function string.formatNumberThousands(num)
    local k, formatted
    formatted = tostring(tonumber(num))
    while true do
        formatted, k = string.gsub(formatted, "^(-?%d+)(%d%d%d)", '%1,%2')
        if k == 0 then break end
    end
    return formatted
end

--- 按照指定分隔符分割字符串
-- @string str 输入字符串
-- @string delimiter 分隔符
-- @return 分割后的字符串列表
-- @usage "123,456,789":split(',') -> {'123','456','789'}
function string.split(str, delimiter)
    local strlist, tmp = {}, string.byte(delimiter)
    if delimiter == "" then
        for i = 1, #str do strlist[i] = str:sub(i, i) end
    else
        for substr in string.gmatch(str .. delimiter, "(.-)" .. (((tmp > 96 and tmp < 123) or (tmp > 64 and tmp < 91) or (tmp > 47 and tmp < 58)) and delimiter or "%" .. delimiter)) do
            table.insert(strlist, substr)
        end
    end
    return strlist
end

-- 和校验
-- @string str 需要校验的字符串
-- @string number 1为返回1个字节，2为返回2个字节
-- @retrun 返回和校验结果
-- @usage string.checkSum("1234",1)
function string.checkSum(str, num)
    assert(type(str) == "string", "The first argument is not a string!")
    local sum = 0
    for i = 1, #str do
        sum = sum + str:sub(i, i):byte()
    end
    if num == 2 then
        return sum % 0x10000
    else
        return sum % 0x100
    end
end

