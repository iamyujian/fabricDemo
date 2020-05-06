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
  _drawMousePointer,
  _moveLineEvent,
  _moveCircleEvent,
  lineLength,
  _dblClick,
  lineMove
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
      mousePoint: { x: 0, y: 0 },
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
      mousePointerCircle: null,
      previewLine: null, //预览线
      starCircle: null, // 画线的预览点
      lineArr: [], // 保存所有的线
      pointer: { startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 } }, // 保存预览点
      clickNum: 0, // 判断点击次数
      circleObj: null, //双击的圆点
      temporaryLine: null, //双击的线
      clickLine: null,
      length: 0,
      lines: null,
      linePath: null,
      offset: { x: 0, y: 0 },
      lineMoved: null
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
        this.canvas.remove(this.mousePointerCircle, this.starCircle);
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
      if (this.mode === "Hand") {
        this.canvas.remove(
          this.mousePointerCircle,
          this.starCircle,
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
        // 圆点跟随鼠标
        this.canvas.remove(this.mousePointerCircle);
        this.mousePointerCircle = makeCircle({
          left: this.mousePoint.x,
          top: this.mousePoint.y,
          stroke: "grey",
          fill: "#fff"
        });
        this.canvas.add(this.mousePointerCircle);

        if (this.clickNum === 1) {
          // 重绘线
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
      const target = option.target;
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
      if (target.name) {
        const index = target.id - 1;
        let line = this.lineArr[index];

        // let path = {
        //   x1: tarLine.path[0][1] + offset.x,
        //   y1: tarLine.path[0][2] + offset.y,
        //   x2: tarLine.path[1][1] + offset.x,
        //   y2: tarLine.path[1][2] + offset.y
        // }
        // this.canvas.remove(target)
        // let line = makeLine({line:`M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`})
        // line.id = id
        // this.lineArr.splice(index,1,line)
        // this.canvas.add(line)
        // line.path[0][1] = target.left;
        // line.path[0][2] = target.top;

        this.canvas.renderAll();
        // }
        if (target.name === "end") {
          line.path[1][1] = target.left;
          line.path[1][2] = target.top;
          this.canvas.renderAll();
        }
      }
    },
    objMoved(option) {
      let target = option.target;
      let id = target.id
      let index = id - 1
      if (target.name) {
      }
      if (target.path) {
        let tarLine = target
        let id = target.id
        let index = id - 1 
        let offset = {
          x: target.left - target.path[0][1],
          y: target.top - target.path[0][2]
        };
        
        let path = {
          x1: tarLine.path[0][1] + offset.x,
          y1: tarLine.path[0][2] + offset.y,
          x2: tarLine.path[1][1] + offset.x,
          y2: tarLine.path[1][2] + offset.y
        }
        this.canvas.remove(target)
        let line = makeLine({line:`M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`})
        line.id = id
        this.lineArr.splice(index,1,line)
        this.canvas.add(line)
      }
    },
    // 双击事件
    mouseDblclick(option) {
      this.lineArr.forEach(line => {
        if (this.canvas.getActiveObject()) {
          if (option.target.id === line.id) {
            let id = line.id;
            // 判断是否已经创建了圆点
            console.log(line.path[0][1]);
            
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

      if (this.mode === "Line") {
        let lineId = this.lineArr.length;
        // 画板元素不能别选中
        this.canvas.skipTargetFind = true;
        // 创建第一个点
        if (this.clickNum === 0) {
          this.startPoint.x = this.mousePoint.x;
          this.startPoint.y = this.mousePoint.y;
          this.pointer.startPoint.x = this.startPoint.x;
          this.pointer.startPoint.y = this.startPoint.y;

          this.starCircle = makeCircle({
            left: this.startPoint.x,
            top: this.startPoint.y
          });
          this.canvas.add(this.starCircle);

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

          this.canvas.remove(this.starCircle, this.previewLine);
          this.previewLine = null;

          let line = makeLine({
            line: `M ${this.pointer.startPoint.x} ${this.pointer.startPoint.y} L ${this.pointer.endPoint.x} ${this.pointer.endPoint.y}`
            // moving: function(option) {
            //   // if (this.circleObj) {
            //   //   this.canvas.remove(
            //   //     this.circleObj.startCircle,
            //   //     this.circleObj.endCircle
            //   //   );
            //   // }
            //   // console.log("path:" + option.target.path);
            // }.bind(this),
            // moved: function(option) {

            // }.bind(this)
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