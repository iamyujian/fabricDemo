<template>
  <div class="canvas">
    <div class="bar">
      <btn @btnClick="btnClick" ref="btn" />
      <div
        v-if="this.clickLine"
        class="lineInof"
      >Detected Object ID: {{this.clickLine.id}}, Length: {{length}}</div>
    </div>

    <canvas id="canvas"></canvas>
    <div class="coordinate">x: {{ mousePoint.x.toFixed(1) }}, y: {{ mousePoint.y.toFixed(1) }}</div>
  </div>
</template>

<script>
import Btn from "./Btn.vue";

import { makeCircle, makeLine } from "@/components/line/line";
import {
  lineLength,
  _redrawLine
} from "./line/lineEven";
export default {
  name: "Canvas",
  components: {
    Btn
  },
  data() {
    return {
      mode: "hand",
      canvas: null,
      mousePoint: { x: 0, y: 0 }, // 鼠标的坐标值
      startPoint: { x: 0, y: 0 }, 
      endPoint: { x: 0, y: 0 },
      mousePointerCircle: null, // 跟随鼠标的小圆点 
      previewLine: null, // 预览线
      previewCircle: null, // 画线的预览点
      lineArr: [], // 保存所有的线
      pointer: { startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 } }, // 保存预览点
      clickNum: 0, // 判断点击次数
      circleObj: null, //双击的圆点
      temporaryLine: null, //双击的线
      clickLine: null,
      length: 0,
    };
  },
  mounted() {
    this.canvas = new fabric.Canvas("canvas", {
      height: 400,
      width: 900,
      // height:window.innerHeight,
      // width:window.innerWidth,
      // isDrawingMode:false,
      backgroundColor: "#eeeeec",
      // 画板不可以选中
      selection: false
    });

    this.canvas.on({
      "mouse:move": this.mouseMove,
      "mouse:down": this.downClick,
      "mouse:dblclick": this.mouseDblclick,
      "object:moving": this.objMoving,
      "object:moved": this.objMoved
    });

    // 按 esc 取消正在画的线段并回到 Hand
    window.onkeydown = e => {
      if (e && e.keyCode == 27) {
        this.btnClick("Hand");
        this.mode = "Hand";
        this.canvas.remove(this.mousePointerCircle, this.previewCircle);
      }
    };
  },
  methods: {
    // 按钮点击样式切换
    btnClick(title) {
      this.mode = title;
      let divArr = this.$refs.btn.$el.children;
      for (let i = 0; i < divArr.length; i++) {
        divArr[i].className = "";
        if (this.mode === divArr[i].innerText) {
          divArr[i].className = "active";
        }
      }
      // 切换到 Hand 页面
      if (this.mode === "Hand") {
        this.canvas.remove(
          this.mousePointerCircle,
          this.previewCircle,
          this.previewLine
        );
      } else {
        this.clickLine = null;
      }
      // 删除线段
      if (this.mode === "Detele") {
        this.canvas.skipTargetFind = false;
        this.canvas.remove(this.canvas.getActiveObject());
      }
    },
    // 鼠标移动事件
    mouseMove(option) {
      this.mousePoint.x = option.pointer.x;
      this.mousePoint.y = option.pointer.y;
      if (this.mode === "Line") {
        // 创建圆点跟随鼠标
        this.canvas.remove(this.mousePointerCircle);
        this.mousePointerCircle = makeCircle({
          left: this.mousePoint.x,
          top: this.mousePoint.y,
          stroke: "grey",
          fill: "#fff"
        });
        this.canvas.add(this.mousePointerCircle);
        // 创建一条预览线
        if (this.clickNum === 1) {
          if (this.previewLine) {
            this.canvas.remove(this.previewLine);
            this.previewLine = makeLine({
              line: `M ${this.startPoint.x} ${this.startPoint.y} L ${this.mousePoint.x} ${this.mousePoint.y}`,
              stroke: "gray"
            });
            this.canvas.add(this.previewLine);
          }
        }
      }
    },
    // 物件移动事件
    objMoving(option) {
      let target = option.target;
      // 移动线的时候删除线两边的小圆点
      if (option.target.path) {
        if (this.circleObj) {
          this.canvas.remove(
            this.circleObj.startCircle,
            this.circleObj.endCircle
          );
          this.circleObj = null;
        }
      }
      // 移动圆点
      const index = target.id - 1;
      let line = this.lineArr[index];
      let id = target.id;
      if (target.name) {
        if (target.name === "start") {
          let path = {
            x1: target.left,
            y1: target.top,
            x2: line.path[1][1],
            y2: line.path[1][2]
          };
          let redrawLine = _redrawLine(line, path, this.canvas);
          this.lineArr.splice(index, 1, redrawLine);
        }
        if (target.name === "end") {
          let path = {
            x1: line.path[0][1],
            y1: line.path[0][2],
            x2: target.left,
            y2: target.top
          };
          let redrawLine = _redrawLine(line, path, this.canvas);
          this.lineArr.splice(index, 1, redrawLine);
        }
        this.length = lineLength(line);
      }
    },
    // 物件移动后触发事件
    objMoved(option) {
      let target = option.target;
      let id = target.id;
      let index = id - 1;
      let line = target;

      // 计算线移动的距离重绘线
      if (target.path) {
        let offset = {
          x: target.left - target.path[0][1],
          y: target.top - target.path[0][2]
        };
        let path = {
          x1: line.path[0][1] + offset.x,
          y1: line.path[0][2] + offset.y,
          x2: line.path[1][1] + offset.x,
          y2: line.path[1][2] + offset.y
        };
        let redrawLine = _redrawLine(line, path, this.canvas);
        this.lineArr.splice(index, 1, redrawLine);
      }
    },
    // 双击物件事件
    mouseDblclick(option) {
      this.lineArr.forEach(line => {
        if (this.canvas.getActiveObject() && option.target.id === line.id) {
          let id = line.id;
          // 双击线生成小圆点
          if (!this.circleObj) {
            let startPoint = makeCircle({
              left: line.path[0][1],
              top: line.path[0][2]
            });
            let lastPoint = makeCircle({
              left: line.path[1][1],
              top: line.path[1][2]
            });
            startPoint.name = "start";
            startPoint.id = id;
            lastPoint.name = "end";
            lastPoint.id = id;
            this.canvas.add(startPoint, lastPoint);
            this.circleObj = {};
            this.circleObj.startCircle = startPoint;
            this.circleObj.endCircle = lastPoint;
          }
        }
      });
    },

    // 鼠标点击事件
    downClick(option) {
      // 判断点击的是否是当前双击的对象，如果不是就移除线两边的圆点
      let target = option.target;
      if (this.circleObj) {
        if (
          (target && this.circleObj.startCircle.id !== target.id) ||
          target === null
        ) {
          this.canvas.remove(
            this.circleObj.startCircle,
            this.circleObj.endCircle
          );
          this.circleObj = null;
        }
      }

      // 点击线得到线的长度
      if (this.mode === "Hand") {
        this.canvas.skipTargetFind = false;
        if (this.canvas.getActiveObject()) {
          this.clickLine = this.canvas.getActiveObject();
          // 得到线的长度
          this.length = lineLength(this.clickLine);
        } else {
          this.clickLine = null;
        }
      }

      // 生成线
      if (this.mode === "Line") {
        let lineId = this.lineArr.length;
        // 画板元素不能别选中
        this.canvas.skipTargetFind = true;
        // 创建第一个点，使用 clickNum 记录鼠标点击的次数
        if (this.clickNum === 0) {
          this.startPoint.x = this.mousePoint.x;
          this.startPoint.y = this.mousePoint.y;
          this.pointer.startPoint.x = this.startPoint.x;
          this.pointer.startPoint.y = this.startPoint.y;

          this.previewCircle = makeCircle({
            left: this.startPoint.x,
            top: this.startPoint.y
          });
          this.canvas.add(this.previewCircle);

          this.previewLine = makeLine({
            line: `M ${this.startPoint.x} ${this.startPoint.y} L ${this.mousePoint.x} ${this.mousePoint.y}`,
            stroke: "gray"
          });
          this.canvas.add(this.previewLine);
        }
        this.clickNum++;

        // 创建第二个点
        if (this.clickNum === 2) {
          this.clickNum = 0;
          this.endPoint.x = this.mousePoint.x;
          this.endPoint.y = this.mousePoint.y;
          this.pointer.endPoint.x = this.endPoint.x;
          this.pointer.endPoint.y = this.endPoint.y;

          this.canvas.remove(this.previewCircle, this.previewLine);
          this.previewLine = null;

          let line = makeLine({
            line: `M ${this.pointer.startPoint.x} ${this.pointer.startPoint.y} L ${this.pointer.endPoint.x} ${this.pointer.endPoint.y}`
          });
          line.id = lineId + 1;
          this.canvas.add(line);
          this.lineArr.push(line);
        }
      }
    }
  }
};
</script>

<style scoped>
html,
body {
  width: 100%;
  height: 100%;
}
.canvas {
  width: 100%;
  height: 100%;
  padding: 10px;
}
#canvas {
  margin-top: 10px;
}
.bar {
  display: flex;
  align-content: center;
  height: 30px;
  line-height: 30px;
}
.lineInof {
  margin-left: 10px;
}
.coordinate {
  margin-top: 10px;
  margin-left: 371px;
}
</style>p