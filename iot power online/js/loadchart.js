

function load(x, data,max) {
    var myChart = echarts.init(document.getElementById('iotpowerchart'));
    option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: x
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            min: 0,
            max: max,
        },
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 999999999999
            },
            {
                start: 0,
                end: 999999999999
            }
        ],
        series: [
            {
                name: 'Current',
                type: 'line',
                symbol: 'none',
                sampling: 'lttb',
                itemStyle: {
                    color: 'rgb(255, 70, 131)'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgb(255, 158, 68)'
                        },
                        {
                            offset: 1,
                            color: 'rgb(255, 70, 131)'
                        }
                    ])
                },
                data: data
            }
        ]
    };
    myChart.setOption(option);
}


function getSec(p,dv){
    return Number((dv.getBigInt64(p,true) - 621355968000000000n) / 10000n)/1000;
}

function show_chart(ab,raw=false) {
    var dv = new DataView(ab);
    var st = getSec(0,dv);//获取初始时间
    var lt = st;//上次的时间
    var max = 0;
    let date = [];
    let data = [];
    var p = 0;
    while(p < ab.byteLength) {
        if(raw) {//显示原始值
            let t = getSec(p,dv) - st; p += 8;//当前时间
            p += 8;//电压，先不用
            if(dv.getFloat64(p,true) > max)
                max = dv.getFloat64(p,true);
            p += 8;//电压，也不用

            var vLen = dv.getInt32(p,true); p += 4;//原始电压数据长度
            p += (vLen * 8);//电压不用
            var cLen = dv.getInt32(p,true); p += 4;//原始电流数据长度
            for(var i=0;i<cLen;i++){
                date.push((t - lt) / cLen * i + t);
                data.push(dv.getFloat64(p,true));
                p += 8;
            }
            lt = t;
        } else {//显示预览值
            date.push(getSec(p,dv) - st); p += 8;//时间
            p += 8;//电压，先不用
            if(dv.getFloat64(p,true) > max)
                max = dv.getFloat64(p,true);
            data.push(dv.getFloat64(p,true)); p += 8;//电流

            var vLen = dv.getInt32(p,true); p += 4;//原始数据长度
            p += (vLen * 8);//原始数据
            var cLen = dv.getInt32(p,true); p += 4;//原始数据长度
            p += (cLen * 8);//原始数据
        }
    }
    load(date, data, max * 1.1);
}

function load_from_url(url,raw=false){
    var request = new XMLHttpRequest();
    request.open("get",url);
    request.send(null);
    request.responseType = "arraybuffer";
    request.onload = function(){
        console.log("data download ok, length",request.response.byteLength);
        show_chart(request.response,raw);
    }
}
//load_from_url("45s.iotps");

//获取元素
var fileInput = document.querySelector("#fileInput");
//监听事件
fileInput.onchange = function() {
    //获取文件
    var file = this.files[0];
    //读取文件
    var fileReader = new FileReader();
    //转换文件为ArrayBuffer
    fileReader.readAsArrayBuffer(file);
    //监听完成事件
    fileReader.onload = function() {
        //打印arraybuffer的字节长度 也是文件的大小 到了这一步就可以使用arraybuffer进行
        //文件的修改之类的操作了
        show_chart(fileReader.result,document.querySelector("#rawInput").checked);
    }
}
