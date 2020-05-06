import {
  makeCircle,
  makeLine
} from './line';
import {
  preCircle
} from '../tools/preGraphics';

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

// 重画线
export function _redrawLine(line, path, canvas) {
  let id = line.id
  canvas.remove(line)
  line = makeLine({ line: `M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}` })
  line.id = id
  canvas.add(line)
  return line
}