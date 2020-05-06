import {
  makeCircle,
  makeLine
} from './line';
import {
  preCircle
} from '../tools/preGraphics';

// 鼠标跟随圆圈

// export function _drawMousePointer(mousePointerCircle, mousePoint, canvas) {
//   // console.log(mousePointerCircle);

//   // if (!mousePointerCircle) {
//     canvas.remove(mousePointerCircle)
//     mousePointerCircle = makeCircle({
//       left: mousePoint.x,
//       top: mousePoint.y,
//       stroke: 'grey',
//       fill: '#fff'
//     })
//     canvas.add(mousePointerCircle)
// console.log(mousePointerCircle)
// } else {
//   mousePointerCircle.set({
//     left: mousePoint.x,
//     top: mousePoint.y
//   })
//   canvas.renderAll()
// }
// }
// export function _dblClick(option, lineArr, circleObj,canvas) {
//   let line, length
//   lineArr.forEach(item => {
//         if (option.target === item) {
//           line = item
//           let startPointX = option.target.x1;
//           let startPointY = option.target.y1;
//           let lastPointX = option.target.x2;
//           let lastPointY = option.target.y2;
//           if (!circleObj) {
//             let startPoint = makeCircle({
//               left: startPointX,
//               top: startPointY,
//               // 移动圆事件
//               moving: function (option) {
//                 let target = option.target;
//                 if (target.id === line.id) {
//                   let startpoint = {};
//                   let endpoint = {};
//                   startpoint.x = lastPointX;
//                   startpoint.y = lastPointY;
//                   endpoint.x = target.left;
//                   endpoint.y = target.top;
//                   _moveLineEvent(line, startpoint, endpoint, this.canvas);
//                   // length = lineLength(this.temporaryLine);
//                 }
//               }.bind(this),
//               // 移动完毕修改直线的当前坐标
//               moved: function (option) {
//                 startPointX = option.target.left;
//                 startPointY = option.target.top;
//               }.bind(this)
//             })

//             let lastPoint = makeCircle({
//               left: lastPointX,
//               top: lastPointY,
//               // 移动圆事件
//               moving: function(option) {
//                 let target = option.target;
//                 if (target.id === line.id) {
//                   let startpoint = {};
//                   let endpoint = {};
//                   startpoint.x = startPointX;
//                   startpoint.y = startPointY;
//                   endpoint.x = target.left;
//                   endpoint.y = target.top;
//                   _moveLineEvent(line, startpoint, endpoint, canvas);
//                   length = lineLength(temporaryLine);
//                 }
//               }.bind(this),
//               // 移动完毕修改直线的当前坐标
//               moved: function(option) {
//                 lastPointX = option.target.left;
//                 lastPointY = option.target.top;
//               }.bind(this)
//             });
//           }
//         };

//         return {
//           line,
//           // length
//         }
//       }

// 移动（重绘）线的事件
// export function _moveLineEvent(previewLine, startPoint, mousePoint, canvas) {
//   if (previewLine) {
//     previewLine.set({
//       x1: startPoint.x,
//       y1: startPoint.y,
//       x2: mousePoint.x,
//       y2: mousePoint.y
//     })
//   }
//   canvas.renderAll()
// }

// 移动（重绘）圆的事件
export function _moveCircleEvent(circleObj, left, top, canvas) {
  if (circleObj) {
    circleObj.set({
      left: left,
      top: top
    })
  }
  canvas.renderAll()
}

// 鼠标点击
export function _mouseDown(mode, startPoint, mousePoint, pointer, starCircle, canvas) {
  let clickNum = 0
  if (!mode === 'line') return
  if (clickNum === 0) {
    startPoint.x = mousePoint.x
    startPoint.y = mousePoint.y
    pointer.push({
      x: startPoint.x,
      y: startPoint.y
    })
    starCircle = preCircle(startPoint, canvas)
  }
}

// 计算线的长度
export function lineLength(line) {
  if (line.path) {
    let x1 = line.path[0][1];
    let y1 = line.path[0][2];
    let x2 = line.path[1][1];
    let y2 = line.path[1][2];
    let side1 = x1 - x2;
    let side2 = y1 - y2;
    let side3 = Math.sqrt(side1 * side1 + side2 * side2);
    return side3.toFixed(2);
  }
}

// 移动 line 完成触发事件
export function lineMove(option) {
  // 移动直线的时候，坐标是不会变的，需要手动修改直线的坐标
  const target = option.target;
  const offset = {
    x: target.left - option.target.path[0][1],
    y: target.top - option.target.path[0][2]
  };
  option.target.path[0][1] += offset.x;
  option.target.path[0][2] += offset.y;
  option.target.path[1][1] += offset.x;
  option.target.path[1][2] += offset.y;
}
