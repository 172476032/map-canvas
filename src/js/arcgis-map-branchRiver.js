import tool from '../utils/tool';
import {
    default as resolutionScale
} from '../canvas/resolutionScale';
import {
    requestAnimationFrame,
    cancelAnimationFrame
} from '../animation/requestAnimationFrame';


var BranchRiver = function (map, userOptions) {
    var self = this;
    self.map = map;

    //默认参数
    var options = {
        type: 'point',
        isShowBaseLine: 'true',
        grap: 10,
        isShowTail: true, //是否显示粒子尾巴效果
        lineWidth: 0.5, //线条宽度
        lineStyle: '#C82800', //线条颜色
        tailOpacity: 0.88, //尾巴动画透明度
        animateLineWidth: 1, //动画线条宽度
        renderLineWidth: [4, 0.9], //尾巴动画线条宽度
        animateLineStyle: '#ffff00', //动画线条颜色
        // colors: ["#516b91", "#59c4e6", "#edafda", "#93b7e3", "#a5e7f0", "#cbb0e3"]
        colors: [
            "#b5c334",
            "rgba(181,195,52,.6)"
            // "#B98153"
        ]
    };

    self.init(userOptions, options);

    //全局变量
    var baseCtx = self.baseCtx = self.options.canvas.getContext("2d");
    var animateCtx = self.animateCtx = self.options.animateCanvas.getContext("2d");
    baseCtx.lineWidth = options.lineWidth;
};

BranchRiver.prototype.init = function (setting, defaults) {
    //合并参数
    tool.merge(setting, defaults);
    this.options = defaults;
};

BranchRiver.prototype.render = function () {
    var self = this;
    var baseCtx = self.baseCtx;
    if (!baseCtx) {
        return;
    }
    var roadLines = self.roadLines;
    roadLines.forEach(function (line) {
        line.drawPath(baseCtx, self.map, self.options);
    });
};

BranchRiver.prototype.animate = function () {
    var self = this;
    var animateCtx = self.animateCtx;
    if (!animateCtx) {
        return;
    }
    if (self.options.isShowTail) {
        animateCtx.fillStyle = "rgba(0,0,0," + self.options.tailOpacity + ")";
        var prev = animateCtx.globalCompositeOperation;
        animateCtx.globalCompositeOperation = "destination-in";
        animateCtx.fillRect(0, 0, self.map.width, self.map.height);
        animateCtx.globalCompositeOperation = prev;
    } else {
        animateCtx.clearRect(0, 0, self.map.width, self.map.height);
    }

    var roadLines = self.roadLines;
    switch (self.options.type) {
        case 'point':
            roadLines.forEach(function (line) {
                // line.draw(animateCtx, self.map, self.options);
                line.drawNew(animateCtx, self.map, self.options);
            });
            break;
        case 'arrow':
            roadLines.forEach(function (line) {
                line.drawArrow(animateCtx, self.map, self.options);
            });
            break;
        case 'circle':
            roadLines.forEach(function (line) {
                line.drawCircle(animateCtx, self.map, self.options);
            });
            break;
    }
};

BranchRiver.prototype.adjustSize = function () {
    var width = this.map.width;
    var height = this.map.height;
    this.baseCtx.canvas.width = width;
    this.baseCtx.canvas.height = height;
    this.animateCtx.canvas.width = width;
    this.animateCtx.canvas.height = height;
    resolutionScale(this.baseCtx);
    resolutionScale(this.animateCtx);
};

BranchRiver.prototype.start = function () {
    var self = this;
    self.stop();
    self.adjustSize();
    self.addLine();
    if (self.options.isShowBaseLine) {
        self.render();
    }

    (function drawFrame() {
        self.timer = setTimeout(function () {
            if (self.animationId) {
                cancelAnimationFrame(self.animationId);
            }
            self.animationId = requestAnimationFrame(drawFrame);
            self.animate();
        }, 60);
    })();
    // (function drawFrame() {
    //     if (self.animationId) {
    //         cancelAnimationFrame(drawFrame);
    //     }
    //     self.animationId = requestAnimationFrame(drawFrame);
    //     self.animateArrow();
    // })();
};

BranchRiver.prototype.stop = function () {
    var self = this;
    if (self.animationId) {
        cancelAnimationFrame(self.animationId);
    }
    if (self.timer) {
        clearTimeout(self.timer);
    }
};

BranchRiver.prototype.addLine = function () {
    var options = this.options;
    var roadLines = this.roadLines = [],
        dataset = this.options.data;

    dataset.forEach(function (line, i) {
        var color = (i == 0 ? options.colors[0] : options.colors[1]);
        var lineWidth = (i == 0 ? options.renderLineWidth[0] : options.renderLineWidth[1]);
        // var baseLineWidth = (i == 0 ? options.renderLineWidth[0] : 0);
        var baseLineWidth = (i == 0 ? 2 : 0);
        roadLines.push(new Line({
            points: line,
            color: color,
            lineWidth: lineWidth,
            baseLineWidth: baseLineWidth
            // color: options.colors[Math.floor(Math.random() * options.colors.length)]
        }));
    });
};

function Line(options) {
    this.points = options.points || [];
    this.age = options.age || 0;
    this.maxAge = options.maxAge || 0;
    this.color = options.color || '#ffff00';
    this.grap = options.grap || 10;
    this.lineWidth = options.lineWidth || 1;
    this.baseLineWidth = options.baseLineWidth || 0;
    this.index = 0;
    this.tempPoints = [0];
}

Line.prototype.getPointList = function (map) {
    var path = this.path = [],
        points = this.points;
    if (points && points.length > 0) {
        points.forEach(function (p) {
            var _screePoint = map.toScreen(p);
            // if (_screePoint.x < 0 || _screePoint.y < 0) {
            //     return;
            // }
            path.push({
                pixel: map.toScreen(p)
            });
        });
        this.maxAge = path.length;
    }
    return path;
};

Line.prototype.drawPath = function (context, map, options) {
    if (this.baseLineWidth == 0) return;
    var pointList = this.path || this.getPointList(map);
    context.save();
    context.beginPath();
    context.lineWidth = this.baseLineWidth;
    context.strokeStyle = '#fff';this.color;
    // context.strokeStyle = options.lineStyle;
    context.moveTo(pointList[0].pixel.x, pointList[0].pixel.y);
    for (var i = 0, len = pointList.length; i < len; i++) {
        context.lineTo(pointList[i].pixel.x, pointList[i].pixel.y);
    }
    context.stroke();
    context.restore();
};

Line.prototype.drawArrow = function (context, map, options) {
    var pointList = this.path || this.getPointList(map);
    var movePoints = this.movePoints;
    if (movePoints && movePoints.length > 0) {
        var moveLen = movePoints.length;
        for (var i = 0; i < moveLen; i++) {
            if (movePoints[i] >= this.maxAge - 1) {
                movePoints[i] = 0;
            }
            var currentPoint = pointList[movePoints[i]];
            context.beginPath();
            // context.lineWidth = options.animateLineWidth;
            context.lineWidth = options.lineWidth;
            context.strokeStyle = this.color;
            context.moveTo(currentPoint.pixel.x, currentPoint.pixel.y);
            context.lineTo(pointList[movePoints[i] + 1].pixel.x, pointList[movePoints[i] + 1].pixel.y);
            context.stroke();

            context.save();

            context.translate(pointList[movePoints[i] + 1].pixel.x, pointList[movePoints[i] + 1].pixel.y);
            //我的箭头本垂直向下，算出直线偏离Y的角，然后旋转 ,rotate是顺时针旋转的，所以加个负号
            var ang = (pointList[movePoints[i] + 1].pixel.x - currentPoint.pixel.x) / (pointList[movePoints[i] + 1].pixel.y - currentPoint.pixel.y);
            ang = Math.atan(ang);
            pointList[movePoints[i] + 1].pixel.y - currentPoint.pixel.y >= 0 ? context.rotate(-ang) : context.rotate(Math.PI - ang); //加个180度，反过来
            context.lineTo(-3, -3);
            context.lineTo(0, 3);
            context.lineTo(3, -3);
            context.lineTo(0, 0);
            context.fillStyle = this.color;
            context.fill(); //箭头是个封闭图形
            context.restore(); //用来恢复Canvas之前保存的状态,否则会影响后续绘制

            this.movePoints[i]++;
        }
    } else {
        this.random(map);
    }
};

Line.prototype.draw = function (context, map, options) {
    var pointList = this.path || this.getPointList(map);
    var movePoints = this.movePoints;
    if (movePoints && movePoints.length > 0) {
        var moveLen = movePoints.length;
        for (var i = 0; i < moveLen; i++) {
            if (movePoints[i] >= this.maxAge - 1) {
                movePoints[i] = 0;
            }
            var currentPoint = pointList[movePoints[i]];
            context.beginPath();
            // context.lineWidth = options.animateLineWidth;
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.color;
            context.lineCap = "round";
            context.moveTo(currentPoint.pixel.x, currentPoint.pixel.y);
            context.lineTo(pointList[movePoints[i] + 1].pixel.x, pointList[movePoints[i] + 1].pixel.y);
            context.stroke();
            this.movePoints[i]++;
        }
    } else {
        this.random(map);
    }
};

//第一个点从0开始，
//0
//0，10
//0，10，20
//0，10，20，30
//0，10，20，30，40
Line.prototype.drawNew = function (context, map, options) {
    var pointList = this.path || this.getPointList(map);
    if (this.movePoints == undefined || this.movePoints.length == 0) {
        this.random(map);
    }
    var movePoints = this.movePoints;
    var moveLen = movePoints.length;
    var tempPoints = this.tempPoints;
    if (tempPoints.length < moveLen) {
        for (var j = 0; j < tempPoints.length; j++) {
            if (tempPoints[j] >= this.maxAge - 1) {
                tempPoints[j] = 0;
            }
            var nowPoint = pointList[tempPoints[j]].pixel;
            var nextPoint = pointList[tempPoints[j] + 1].pixel;

            context.beginPath();
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.color;
            context.lineCap = "round";
            context.moveTo(nowPoint.x, nowPoint.y);
            context.lineTo(nextPoint.x, nextPoint.y);
            context.stroke();
            this.tempPoints[j]++;
            var index = this.tempPoints[tempPoints.length - 1];
            if (movePoints.contains(index)) { //&& !tempPoints.contains(index)
                // tempPoints.push(0);
                tempPoints.unshift(0);
            }
        }
    } else {
        for (var k = 0; k < moveLen; k++) {
            if (movePoints[k] >= this.maxAge - 1) {
                movePoints[k] = 0;
            }
            var currentPoint = pointList[movePoints[k]];
            context.beginPath();
            // context.lineWidth = options.animateLineWidth;
            context.lineWidth = this.lineWidth;
            context.strokeStyle = this.color;
            context.lineCap = "round";
            context.moveTo(currentPoint.pixel.x, currentPoint.pixel.y);
            context.lineTo(pointList[movePoints[k] + 1].pixel.x, pointList[movePoints[k] + 1].pixel.y);
            context.stroke();
            this.movePoints[k]++;
        }
    }
};

Line.prototype.drawCircle = function (context, map, options) {
    var pointList = this.path || this.getPointList(map);
    if (this.movePoints && this.movePoints.length > 0) {
        var moveLen = this.movePoints.length;
        for (var i = 0; i < moveLen; i++) {
            if (this.movePoints[i] >= this.maxAge - 1) {
                this.movePoints[i] = 0;
            }
            var currentPoint = pointList[this.movePoints[i]];
            context.beginPath();
            // context.arc(currentPoint.pixel.x, currentPoint.pixel.y, 1, 0, Math.PI * 2);
            context.arc(currentPoint.pixel.x, currentPoint.pixel.y, this.lineWidth, 0, Math.PI * 2);
            context.fillStyle = this.color;
            context.fill();
            this.movePoints[i]++;
        }
    } else {
        this.random(map);
    }
};

Line.prototype.random = function (map) {
    var pointList = this.path || this.getPointList(map);
    var arr = [],
        gap = this.grap, //间隔
        maxNum = Math.floor(pointList.length / gap);

    while (arr.length < maxNum) {
        for (var i = 0; i < pointList.length; i += gap) {
            if (arr.length === 0) { //如果数组长度为0则直接添加到arr数组
                arr.push(i);
            } else {
                if (arr.indexOf(i) == -1) {
                    arr.push(i);
                }
            }
        }
    }

    // this.movePoints = [0];
    this.movePoints = arr;
};

//声明----如果有此 contains 直接用最好
Array.prototype.contains = function (needle) {
    for (var i in this) {
        if (this[i] == needle) return true;
    }
    return false;
}

Line.prototype.generate = function (map) {
    var pointList = this.path || this.getPointList(map);

};

export default BranchRiver;