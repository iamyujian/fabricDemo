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
import { lineLength, _redrawLine } from "./line/lineEven";
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
      bzCircleArr: [],
      bzStartPoint: null,
      bzEndCircle: null,
      bzPreviewLine: null,
      bzLineArr: [],
      bzClickNum: 0,
      controlPoint: null, // 控制点
      // preControlPoint: null,
      mouseUpPoint: null, // mouseup时的坐标
      iscontrol: false
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
      "object:moved": this.objMoved,
      "mouse:up": this.mouseUp
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
      if (this.mode !== "BezierCurve") {
        this.canvas.remove(this.bzPreviewLine);
        this.bzClickNum = 0;
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
      if (this.mode !== "Hand") {
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
        // 创建贝兹曲线预览线
        if (this.bzClickNum === 3) {
          // 上一个圆的点
          let index = this.bzCircleArr.length;
          // 当前圆的点
          let { x, y } = this.bzStartPoint;
          // 生成预览线
          if (this.bzPreviewLine) {
            this.canvas.remove(this.bzPreviewLine);
          }

          // up 触发后再给预览线设置控制点
          if (this.iscontrol) {
            let index = this.bzCircleArr.length;
            let endCir = this.bzCircleArr[index - 1];
            this.bzPreviewLine = makeLine({
              line: `M ${x} ${y} C ${x} ${y} ${endCir.ctp1.x}
              ${endCir.ctp1.y} ${this.mousePoint.x}
              ${this.mousePoint.y}`,
              stroke: "gray"
            });
          } else {
            this.bzPreviewLine = makeLine({
              line: `M ${x} ${y} C ${x} ${y} ${this.mousePoint.x}
              ${this.mousePoint.y} ${this.mousePoint.x}
              ${this.mousePoint.y}`,
              stroke: "gray"
            });
          }
          this.canvas.add(this.bzPreviewLine);

          // 判断有没有可以控制的线
          if (this.bzLineArr.length) {
            // 得到上一个圆点的位置坐标
            let { x1, y1 } = {
              x1: this.bzCircleArr[index - 2].left,
              y1: this.bzCircleArr[index - 2].top
            };
            let bzLine = this.bzLineArr[this.bzLineArr.length - 1];

            // 如果不是从mouseup生成的线就进入（鼠标只触发down不触发up的时候触发）
            if (bzLine.name !== "mouseUpbzLine") {
              // 计算控制点
              this.controlPoint = {
                x: x + x - this.mousePoint.x,
                y: y + y - this.mousePoint.y
              };

              this.canvas.remove(bzLine);
              bzLine = makeLine({
                line: `M ${x1} ${y1} C ${x1} ${y1} ${this.controlPoint.x}
              ${this.controlPoint.y} ${x}
              ${y}`,
                stroke: "blue"
              });
              this.canvas.add(bzLine);
              this.bzLineArr.splice(this.bzLineArr.length - 1, 1, bzLine);
              bzLine.name = "movingbzLine";
            }
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
          let redrawLine = _redrawLine(line, path, this.canvas, "blue");
          this.lineArr.splice(index, 1, redrawLine);
        }
        if (target.name === "end") {
          let path = {
            x1: line.path[0][1],
            y1: line.path[0][2],
            x2: target.left,
            y2: target.top
          };
          let redrawLine = _redrawLine(line, path, this.canvas, "blue");
          this.lineArr.splice(index, 1, redrawLine);
        }
        this.length = lineLength(line);
      }
    },
    // 物件移动后触发事件
    objMoved(option) {
      let target = option.target;
      if (this.mode === "Line") {
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
          let redrawLine = _redrawLine(line, path, this.canvas, "blue");
          this.lineArr.splice(index, 1, redrawLine);
        }
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
      let target = option.target;
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
        // 判断点击的是否是当前双击的对象，如果不是就移除线两边的圆点
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
        this.lineArr.forEach(line => {
          line.set({ stroke: "green" });
          if (target && target.id && target.id === line.id) {
            line.set({ stroke: "blue" });
          }
        });
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

      // 生成贝兹曲线
      if (this.mode === "BezierCurve") {
        this.bzClickNum = 0;
        let { x, y } = this.mousePoint;
        // 每次点击的时候创建一个圆
        if (this.bzClickNum === 0) {
          this.bzStartPoint = { x: x, y: y };
          let bzStartCircle = makeCircle({ left: x, top: y });
          bzStartCircle.bzId = this.bzCircleArr.length;
          let index = this.bzCircleArr.length;

          this.bzCircleArr.push(bzStartCircle);
          this.canvas.add(bzStartCircle);
          // 判断预览线存在与否
          if (this.bzPreviewLine) {
            // 拿到上一个圆点的坐标作为线的开始点
            let { x, y } = {
              x: this.bzCircleArr[index - 1].left,
              y: this.bzCircleArr[index - 1].top
            };
            let bzLine = makeLine({
              line: `M ${x} ${y} C ${x} ${y} ${this.mousePoint.x}
              ${this.mousePoint.y} ${this.mousePoint.x}
              ${this.mousePoint.y}`,
              stroke: "blue"
            });
            this.canvas.add(bzLine);
            this.bzLineArr.push(bzLine);
            bzLine.bzId = this.bzLineArr.length;
          }
          // 等于 3 执行 moving 中事件
          this.bzClickNum = 3;
        }
      }
    },
    mouseUp() {
      // 第一次点击不进入
      if (this.bzPreviewLine) {
        // 记录up时当前鼠标的坐标
        this.mouseUpPoint = this.mousePoint;
        // 当前圆的点
        let { x, y } = this.bzStartPoint;
        // 上一个圆的点
        let index = this.bzCircleArr.length;
        let endCir = this.bzCircleArr[index - 1];
        if (index - 2 >= 0) {
          // 上一个圆点的位置坐标
          let preCircle = this.bzCircleArr[index - 2];
          let { x1, y1 } = {
            x1: preCircle.left,
            y1: preCircle.top
          };
          // 数组中最后一条线
          let bzLine = this.bzLineArr[this.bzLineArr.length - 1];
          // 画直线的时候 controlPoint 为空，重新设置control的值
          if (!this.controlPoint) {
            this.controlPoint = {
              x: this.mouseUpPoint.x,
              y: this.mouseUpPoint.y
            };
          }
          // 将控制点的坐标保存到当前圆里
          endCir.ctp1 = {
            x: this.mousePoint.x,
            y: this.mousePoint.y
          };
          endCir.ctp2 = {
            x: this.controlPoint.x,
            y: this.controlPoint.y
          };
          // 创建最终的线段
          this.canvas.remove(bzLine);
          bzLine = makeLine({
            line: `M ${x1} ${y1} C ${x1} ${y1} ${this.controlPoint.x}
              ${this.controlPoint.y} ${x}
              ${y}`,
            stroke: "green"
          });
          bzLine.name = "mouseUpbzLine";
          // 将控制点保存在当前圆的坐标点对象里
          // this.bzStartPoint.ctp1 = {x: x1, y: y1}
          // this.bzStartPoint.ctp2 = {x: this.controlPoint.x, y: this.controlPoint.y}
          // console.log(this.bzStartPoint);

          this.canvas.add(bzLine);
          this.bzLineArr.splice(this.bzLineArr.length - 1, 1, bzLine);
          // 清空控制点，不然画直线的时候会被影响
          this.controlPoint = null;
          this.iscontrol = true;
        }
      }

      // let { x, y } = this.mousePoint;
      // let index = this.bzCircleArr.length;
      // // 判断预览线存在与否
      // if (this.bzPreviewLine) {
      //   // 拿到上一个圆点的坐标作为线的开始点
      //   let { x, y } = {
      //     x: this.bzCircleArr[index - 1].left,
      //     y: this.bzCircleArr[index - 1].top
      //   };
      //   // 当前圆
      //   let { x1, y1 } = {
      //     x: this.bzCircleArr[index].left,
      //     y: this.bzCircleArr[index].top
      //   };
      //   // 控制点
      //   let controlPoint = {
      //     x: x + x - this.mousePoint.x,
      //     y: y + y - this.mousePoint.y
      //   };
      //   this.canvas.remove(this.bzPreviewLine);
      //   let bzLine = makeLine({
      //     line: `M ${x} ${y} C ${x} ${y} ${controlPoint.x}
      //         ${controlPoint.y} ${this.mousePoint.x}
      //         ${this.mousePoint.y}`
      //   });
      //   console.log(bzLine);

      //   bzLine.bzId = this.bzLineArr.length + 1;
      //   this.canvas.add(bzLine);
      //   this.bzLineArr.push(bzLine);
      //   this.bzPreviewLine = null;
      // }
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