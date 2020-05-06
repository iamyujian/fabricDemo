import {makeCircle,
  makeLine} from '../line/line';
export function preCircle(startPoint,canvas) {
  let starCircle = makeCircle(startPoint.x,startPoint.y)
  canvas.add(starCircle)
  return starCircle
}

export function preLine(startPoint,mousePoint) {
  let previewLine = makeLine([this.startPoint.x,
    startPoint.y,
    mousePoint.x,
    mousePoint.y],'gray')
  return previewLine
}