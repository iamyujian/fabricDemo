import {
  makeCircle,
  makeLine
} from './line';

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

// 重画线
export function _redrawLine(line, path, canvas,stroke = 'green') {
  let id = line.id
  canvas.remove(line)
  line = makeLine({ line: `M ${path.x1} ${path.y1} L ${path.x2} ${path.y2}`,stroke:stroke })
  line.id = id
  canvas.add(line)
  return line
}