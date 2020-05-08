// 造圆函数
export function makeCircle({ left,
  top,
  radius = 5,
  strokeWidth = 1,
  stroke = "red",
  fill = "#fff",
  moving,moved }) {
  const c = new fabric.Circle({
    originX: "center",
    originY: "center",
    left: left,
    top: top, 
    strokeWidth: strokeWidth,
    fill: fill,
    stroke: stroke,
    radius: radius
  });
  c.hasControls = c.hasBorders = false;
  return c;
}

export function makeLine({line, stroke = 'green',moving,moved}) {
  const l = new fabric.Path(line, {
    fill: "",
    stroke: stroke,
    strokeWidth: 1
  });
  l.hasControls  = false;
  // l.selectable = true
  // l.on({
  //   'moving': moving,
  //   'moved':moved
  // });
  // 设置可以直接改 Path 中坐标的值
  l.objectCaching = false;
  return l;
}
