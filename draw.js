/**
 * 预览线
 * @param {Object} canvas 画板
 * @param {Array} coordinate M坐标
 * @param {Object} bzCurve C坐标
 * @param {Number} x 鼠标X坐标
 * @param {Number} y 鼠标Y坐标
 */
function _previewPath({canvas, coordinate, bzCurve, x, y }) {
  if (coordinate.length < 1) return;
  // 拿到坐标组中的每次点击后的最后一个点当做开始点
  const endCoordinate = coordinate[coordinate.length - 1];
  let path = `M ${endCoordinate.points[endCoordinate.points.length - 2]} ${endCoordinate.points[endCoordinate.points.length - 1]}
  C ${bzCurve.controlPoint.x} ${bzCurve.controlPoint.y} ${x} ${y} ${x} ${y}`
  _removeObj(canvas, 'previewPath');
  const previewPath = new fabric.Path(path, {
    name: 'previewPath',
    stroke: '#00000080',
    fill: 'transparent',
    selectable: false,
    hoverCursor: 'default'
  });
  canvas.add(previewPath);
  previewPath.sendToBack();
}

/**
 * 绘制跟随鼠标小圆点
 * @param {Object} canvas 画板
 * @param {Number} x 鼠标坐标
 * @param {Number} y 鼠标坐标
 */
function _followMouseDots(canvas, x, y) {
  _removeObj(canvas, 'dots');
  let dots = new fabric.Circle({
    name: 'dots',
    left: x,
    top: y,
    radius: 5,
    originX: 'center',
    originY: 'center',
    stroke: 'red',
    fill: 'transparent',
    strokeWidth: 1,
    selectable: false,
    hasBorder: false,
    hasControls: false
  });
  canvas.add(dots);
  if (x <= 0 || y <= 0) _removeObj(canvas, 'dots');
}

/**
 *  使用path画线
 * @param {Object} canvas 画板
 * @param {Array} coordinate 坐标组
 * @param {String} id id
 * @param {String} name name
 * @param {String} stroke 画笔颜色
 */
function _drawPath({ canvas, coordinate, id, name = 'bezierCurve', stroke = 'green', mousedown, mousedbl, movedObj, movingObj }) {
  // 移除一开始生成的线
  _removeObj(canvas, name );
  // 拼接路径
  let path = '';
  coordinate.forEach(data => {
    path += `${data.type} `;
    data.points.forEach(point => {
      path += `${point} `;
    });
  });
  // 根据路径画线
  const bezier = new fabric.Path(path, {
    id, name, stroke, fill: 'transparent',
    // 控件可以被选择和操作
    selectable: true,
    // 只能移动不能（编辑）操作
    hasControls: false,
    // 对象悬停时的自定义光标
    // hoverCursor: 'default'
  });
  bezier.on('mousedblclick', mousedbl);
  bezier.on('mousedown', mousedown);
  bezier.on('moved', movedObj);
  bezier.on('moving', movingObj);
  canvas.add(bezier);
  bezier.sendToBack();
}

/**
 * 绘制 circle
 * @param {Object} canvas 画板
 * @param {Number} x left值
 * @param {Number} y top值
 * @param {String} stroke 画笔颜色
 * @param {String} fill 填充颜色
 * @param {Number} radius 半径
 * @param {String} name name
 * @param {Boolean} add 是否添加
 */
// 鼠标点击生成的第一个基础圆点
function _drawPoint({ canvas, x, y, stroke = 'red', fill = 'white', radius = 4, name = 'bzPoint', add = true }) {
  const point = new fabric.Circle({
    name,
    left: x,
    top: y,
    radius,
    stroke,
    fill,
    selectable: true,
    hasBorder: false,
    hasControls: false,
    originX: 'center',
    originY: 'center'
  });
  if (add) canvas.add(point);
  return point;
}
// 绘制 circle 点
function _drawBezierPoint({ canvas, x, y, stroke, fill, radius, data, moving, moved }) {
  const bezierPoint = _drawPoint({ canvas, x, y, stroke, fill, radius, add: false });
  bezierPoint.data = data;
  bezierPoint.on('moving', moving);
  bezierPoint.on('moved', moved);
  canvas.add(bezierPoint);
}

// 绘制线上的点
function _drawLinePoint({ canvas, coordinate, id, movingPoint, movedPoint, movingControlPoint }) {
  _removeObj(canvas, 'bzPoint');
  _removeObj(canvas, 'line');
  coordinate.forEach((path, indexPath) => {
    // 将线两端的点的数据打包
    const data = {id, type: path.type, indexPath};
    // 如果点的类型时 L
    if (path.type === 'M' || path.type === 'L') {
      path.points.forEach((point, indexPoint) => {
        // 如果是第二个点
        if (indexPoint % 2 === 1) {
          // 画点,将打包的data写进圆点对象里
          _drawBezierPoint({ canvas, x: path.points[indexPoint - 1], y: point, data: { ...data, indexPoint: indexPoint - 1 }, moving: movingPoint, moved: movedPoint });
        }
      });
    };
    if (path.type === 'C') {
      path.points.forEach((point, indexPoint) => {
        // indexPoint: 0 1 2 3 4 5 
        if (indexPoint % 2 === 1) {  // indexPoint: 1 3 5，方便得到每个点坐标
          if (indexPath !== 0) {
            if (indexPoint === 1) {
              // 0 的坐标位置(第一个控制点,起始点重合的控制点)
              const prevPath = coordinate[indexPath - 1];
              // 0 点的 x y 轴
              const prevPoint = {
                x: prevPath.points[prevPath.points.length - 2],
                y: prevPath.points[prevPath.points.length - 1]
              };
              // 画线
              drawLine({ canvas, p1: prevPoint, p2: { x: path.points[indexPoint - 1], y: point } });
            }
          }
          // 遍历到最后一个点时，画出控制线
          if (indexPoint === path.points.length - 1) { // indexPoint：5
            // 第二个控制点的位置
            const prevPoint = {
              x: path.points[indexPoint - 3],
              y: path.points[indexPoint - 2]
            };
            drawLine({ canvas, p1: prevPoint, p2: { x: path.points[indexPoint - 1], y: point } });
          };
          // 画控制线上的圆点
          // 绘制每条线的结尾点
          if (indexPoint === path.points.length - 1) { // indexPoint：5
            _drawBezierPoint({
              canvas,
              x: path.points[indexPoint - 1],
              y: point,
              data: { ...data, indexPoint: indexPoint - 1 },
              moving: movingPoint,
              moved: movedPoint
            });
          } else {
            // 绘制控制点上的圆
            _drawBezierPoint({
              canvas,
              x: path.points[indexPoint - 1],
              y: point,
              stroke: '#40a9ff',
              radius: 3.5,
              data: { ...data, indexPoint: indexPoint - 1 },
              moving: movingControlPoint,
              moved: movedPoint
            });
          }
        };
      });
    };
  });
}

// 绘制 bezier curve上的 line
function drawLine({ canvas, p1, p2, name = 'line', stroke = '#40a9ff' }) {
  const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
    name,
    stroke,
    selectable: false,
    hoverCursor: 'default'
  });
  canvas.add(line);
  line.sendToBack();
}

/**
 * 根据name删除画板内的对象
 * @param {Object} canvas 画板
 * @param {String} name 对象name属性
 */
function _removeObj( canvas, name ) {
  const removeObj = canvas._objects.filter(item => item.name === name);
  removeObj.forEach(item => canvas.remove(item));
}