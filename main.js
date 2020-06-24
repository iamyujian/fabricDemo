var app = new Vue({
  el: '#app',
  data: {
    canvas: null,
    canvasSize: {
      width: 300,
      height: 300
    },
    // 保存所有的数据
    allDatas: [],
    // 当前对象ID
    activeObjId: null,
    // 当前对象数据（length等）
    activeObjData: {},
    // 鼠标坐标
    mouse: {
      position: { x: 0, y: 0 }
    },
    // 当前创建对象的数据
    currentData: { id: null, coordinate: []},
    // 按钮切换
    mode: 'hand',
    modeList: [
      {type: 'hand', font: 'Hand'},
      {type: 'bezierCurve', font: 'Bezier Curve'},
      {type: 'line', font: 'Line'},
      {type: 'detect', font: 'Detect'},
      {type: 'delete', font: 'Delete'}
    ]
  },
  watch: {
    // 监听当前选择ID(包括为空)的变化，更变选择对象的颜色和变化
    activeObjId: {
      deep: true,
      handler: function(newVal, oldVal) {
        _removeObj(this.canvas, 'bzPoint');
        _removeObj(this.canvas, 'line');
        this.activeObj = this.findObjById(newVal);
        if (this.activeObj) this.activeObj.set('stroke', 'red')
        if (oldVal) {          
          const old = this.findObjById(oldVal);
          if (!old) return;
          const oldData = this.findDataById(oldVal);
          if (oldData.showPoint) oldData.showPoint = false;
          old.set('stroke', 'green');
        }
      }
    },
    // 切换模式时，清除界面需要隐藏的对象
    mode: {
      deep: true,
      handler: function(newVal, oldVal) {
        this.activeObjId = null;
        _removeObj(this.canvas, 'dots');
        _removeObj(this.canvas, 'previewPath');
        _removeObj(this.canvas, 'bzPoint');
        _removeObj(this.canvas, 'line');
        // 从bezierCurve切换到hand时
        if (newVal === 'hand') {
          if (oldVal === 'bezierCurve') this.updateData('bezierCurve');
          else this.updateData();
        }
        // 从bezierCurve切换到line时
        if (this.mode === 'line') {
          if (oldVal === 'bezierCurve') {
            this.updateData('bezierCurve');
            this.activeObjId = null;
            this.currentData.coordinate = [];
          }
          else this.updateData();
        }
        // 从line切换到bezierCurve时
        if (this.mode === 'bezierCurve') {
          if (oldVal === 'line') {
            this.activeObjId = null;
            this.currentData.coordinate = [];
          }
        }
      }
    }
  },
  mounted() {
    // 初始化
    this.initCanvas();
    this.initCanvasSize();
    this.updateSize();
    // 按 esc 取消正在画的线段并回到 Hand
    window.onkeydown = e => {
      if (e && e.keyCode == 27) {
        if (this.mode === 'bezierCurve') this.updateData('bezierCurve');
        else this.updateData();
        this.mode = 'hand';
        this.activeObjId = null;
        _removeObj(this.canvas, 'dots');
        _removeObj(this.canvas, 'previewPath');
        _removeObj(this.canvas, 'bzPoint');
      }
    };
  },
  methods: {
    // 切换模式
    modeClick(mode) {
      this.mode = mode;
      // 删除对象按钮
      if (this.mode === 'delete') {
        this.deleteObj(this.activeObjId);
        this.activeObjId = null;
      }
    },
    // 初始化 canvas
    initCanvas() {
      this.canvas = new fabric.Canvas('canvas', {
        width: this.canvasSize.width,
        heigth: this.canvasSize.height,
        backgroundColor: '#eeeeec',
        // 画板显示选中
        selection: false,
        // 鼠标样式
        hoverCursor: 'default'
      });
      this.canvas.on({
        'mouse:move': this.mousemove,
        'mouse:down': this.mousedown,
        'mouse:up': this.mouseup
      }); 
    },
    // 初始化 canvas 尺寸
    initCanvasSize() {
      this.canvasSize.width = window.innerWidth * 0.95;
      this.canvasSize.height = window.innerHeight * 0.7;
    },
    // 更新 canvas 尺寸
    updateSize() {
      this.initCanvasSize();
      this.canvas.setWidth(this.canvasSize.width);
      this.canvas.setHeight(this.canvasSize.height);
      this.canvas.renderAll();
    },
    // 鼠标移动事件
    mousemove(e) {
      // 如果处于点击状态移动的时候开启拖动
      if (this.mouse_down) this.mouse_drag = true;
      // 记录鼠标坐标
      this.mouse.position.x = e.absolutePointer.x;
      this.mouse.position.y = e.absolutePointer.y;
      switch (this.mode) {
        case 'line': {
          // 跟随鼠标圆点
          _followMouseDots(this.canvas, this.mouse.position.x, this.mouse.position.y);
          // 绘制预览线
          _previewPath({canvas: this.canvas, coordinate: this.currentData.coordinate, bzCurve: this.bzCurve, x: this.mouse.position.x, y: this.mouse.position.y });
          break;
        }
        case 'bezierCurve': {
          // 跟随鼠标圆点
          _followMouseDots(this.canvas, this.mouse.position.x, this.mouse.position.y);
          this.updateBZData();
          // 绘制预览线
          _previewPath({canvas: this.canvas, coordinate: this.currentData.coordinate, bzCurve: this.bzCurve, x: this.mouse.position.x, y: this.mouse.position.y });
          break;
        }
        case 'detect': {
          this.mouseDistanceObj();
          _followMouseDots(this.canvas, this.mouse.position.x, this.mouse.position.y);
        }
        default:
          break;
      }
    },
    // 鼠标点击按钮事件
    mousedown(e) {
      this.mouse_down = true;
      switch (this.mode) {
        case 'hand':
          if (!e.target) this.activeObjId = null;
          break;
        case 'line':
          this.recordCoordinates();
          _removeObj(this.canvas, 'previewPath');
          break;
        case 'bezierCurve':
          this.recordCoordinates();
          _drawPath({ canvas: this.canvas, coordinate: this.currentData.coordinate, stroke: 'green', id: this.currentData.id, name: 'prebz', mousedown: this.mousedownObj, mousedbl: this.mousedblClick, movingObj: this.movingObj, movedObj: this.movedObj });
          break;
      
        default:
          break;
      }
    },
    mouseup() {  
      // 鼠标点击结束
      this.mouse_down = false;
      // 曲线线不可拖动
      this.mouse_drag = false;
    },
    // 生成path的坐标
    recordCoordinates() {
      // 鼠标坐标
      const { x, y } = this.mouse.position;
      let data = {};
      // 记录第一次点击的位置
      if (this.currentData.coordinate.length === 0) {
        data = {
          type: 'M',
          points: [x, y]
        };
        this.currentData.id = new Date().valueOf();
        // 记录直线第二个点
      } else if (this.mode === 'line') {
        data = {
          type: 'L',
          points: [x, y]
        };
        this.restart = true;
        // 生成贝兹曲线需要的坐标
      } else if (this.mode === 'bezierCurve') {
        data = {
          type: 'C',
          points: [this.bzCurve.controlPoint.x, this.bzCurve.controlPoint.y, x, y, x, y]
        };
        this.bzRestart = true;
      }
      // 添加到数组中保存起来(贝兹曲线保存的是上一条线的控制点)
      this.currentData.coordinate.push(data);
      
      // 定义和重置贝兹曲线的控制点和开始点
      this.bzCurve = {
        startPoint: { x, y },
        controlPoint: { x, y }
      };
      _drawPoint({ canvas: this.canvas, x, y });
      if (this.restart) this.updateData();
    },
    // 保存数据并重画更新数据
    updateData(mode) {
      // 如果只有一个点的时候 return
      if (this.currentData.coordinate.length <= 1 || !this.currentData.id) return;
      // 直线绘画完毕后移除两端小圆点
      _removeObj( this.canvas, 'bzPoint' );
      this.currentData.mode = this.mode;
      if (mode === 'bezierCurve') this.currentData.mode = mode;
      // 将线的长度保存起来
      if (this.currentData.mode === 'line') this.currentData.length = this.lineLength(this.currentData.coordinate);
      // 将所有数据保存到数组中
      this.allDatas.push(JSON.parse(JSON.stringify(this.currentData)));
      
      // 清空坐标数组，重新开始
      this.currentData.coordinate.length = 0;
      this.currentData.id = null;
      // 根据数组中的数据画线
      this.allDatas.forEach((data, index) => {
        // 先移除再创建
        _removeObj(this.canvas, `path-${data.id}`);
        // 重画贝兹曲线前先把临时线移除
        _removeObj(this.canvas, 'prebz');
        _drawPath({ canvas: this.canvas, coordinate: data.coordinate, id: data.id, name: `path-${data.id}`, mousedown: this.mousedownObj, mousedbl: this.mousedblClick, movedObj: this.movedObj, movingObj: this.movingObj });
        data.detectPoints = this.createDetectPoints(data.coordinate);
      });
      this.restart = false;
    },
    // 拖动时更新贝兹曲线的控制点
    updateBZData() {
      // 判断点击的时候开启拖动
      if (!this.mouse_drag) return;
      if (this.currentData.coordinate.length < 2) return;
      // 拿到当前数据中的最后一个点的坐标
      const endCoordinate = this.currentData.coordinate[this.currentData.coordinate.length - 1];
      // 拖动时更变第二个控制点的值
      endCoordinate.points[2] = 2 * endCoordinate.points[4] - this.mouse.position.x;
      endCoordinate.points[3] = 2 * endCoordinate.points[5] - this.mouse.position.y;
      // 清空临时控制点
      this.bzCurve.controlPoint.x = this.mouse.position.x;
      this.bzCurve.controlPoint.y = this.mouse.position.y;

      // 画线
      _drawPath({ canvas: this.canvas, coordinate: this.currentData.coordinate, stroke: 'green', id: this.currentData.id, name: 'prebz',  mousedown: this.mousedownObj, mousedbl: this.mousedblClick, movedObj: this.movedObj, movingObj: this.movingObj });
    },
    // 对象点击事件
    mousedownObj(e) {
      const target = e.target;
      if (!target) return;
      // 拿到线的ID
      this.activeObjId = target ? target.id : null;
      const obj = this.findDataById(this.activeObjId);
      // 如果点击的是直线的时候就显示长度
      if (obj.mode === 'line') this.activeObjData.length = obj.length.toFixed(1);
      else this.activeObjData.length = 0;
      // 保存物件当时的坐标
      this.distance = { x: target.left, y: target.top };
    },
    // 对象双击事件
    mousedblClick(e) {
      const target = e.target;
      if (!target) return;
      // 根据ID从数组中拿到保存的数据
      const targetData = this.findDataById(target.id);
      // 是否显示
      targetData.showPoint = true;
      // 根据数据生成圆点和线
      _drawLinePoint({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, movingPoint: this.movingPoint, movedPoint: this.movedPoint, movingControlPoint: this.movingControlPoint });
      // 取消选中状态
      this.canvas._activeObject = null;
    },
    // 移动圆点对象事件
    movingPoint(e) {
      _removeObj(this.canvas, 'bzPoint');
      _removeObj(this.canvas, 'line');
      const { data, left, top } = e.target;
      const targetData = this.findDataById(data.id);
      // 计算移动距离
      const offset = {
        x: left - targetData.coordinate[data.indexPath].points[data.indexPoint],
        y: top - targetData.coordinate[data.indexPath].points[data.indexPoint + 1]
      };
      // 计算移动后的坐标
      targetData.coordinate[data.indexPath].points[data.indexPoint] += offset.x;
      targetData.coordinate[data.indexPath].points[data.indexPoint + 1] += offset.y;
      targetData.coordinate[data.indexPath].points[data.indexPoint - 2] += offset.x;
      targetData.coordinate[data.indexPath].points[data.indexPoint - 1] += offset.y;
      // 下一个路径
      const nextPath = targetData.coordinate[data.indexPath + 1];
      if (nextPath && nextPath.type === 'C') {
        // 更新开始点的坐标
        nextPath.points[0] += offset.x;
        nextPath.points[1] += offset.y;
      }
      // 根据计算后的坐标重新生成线
      _removeObj(this.canvas, `path-${targetData.id}`);
      _drawPath({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, name: `path-${targetData.id}`, stroke: 'red', mousedown: this.mousedownObj, mousedbl: this.mousedblClick, movingObj: this.movingObj, movedObj: this.movedObj });
      // 移动时重新计算长度
      if (targetData.mode === 'line') {
        targetData.length = this.lineLength(targetData.coordinate);
        this.activeObjData.length = targetData.length.toFixed(1);
      }
      _drawLinePoint({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, movingPoint: this.movingPoint, movedPoint: this.movedPoint, movingControlPoint: this.movingControlPoint });
    },
    
    // 控制点 moved 事件
    movedPoint(e) {
      const { data } = e.target;
      const targetData = this.findDataById(data.id);
      // 添加侦测点
      targetData.detectPoints = this.createDetectPoints(targetData.coordinate);
    },
    // 创建线上的侦测点
    createDetectPoints(coordinate, percent = 100) {
      // 声明侦测点数组
      const detectPoints = [];
      coordinate.forEach((path, index) => {
        if (index === 0) return;
        // 得到每个终点的坐标数据
        const prevPath = coordinate[index - 1];
        
        // 声明控制点
        const c1 = { x: null, y: null };
        const c2 = { x: null, y: null };
        // 声明开始点
        const start = { x: null, y: null };
        // 开始点坐标赋值给start
        if (prevPath.type === 'M' || prevPath.type === 'L') {
          start.x = prevPath.points[0];
          start.y = prevPath.points[1];
        }
        // 每段贝兹曲线的开始点坐标
        if (prevPath.type === 'C') {
          start.x = prevPath.points[4];
          start.y = prevPath.points[5];
        }
        // 得到终点的坐标
        const end = { x: null, y: null };
        if (path.type === 'L') {
          end.x = path.points[0];
          end.y = path.points[1];
        }
        // 每段贝兹曲线的终点位置坐标位置
        if (path.type === 'C') {
          c1.x = path.points[0];
          c1.y = path.points[1];
          c2.x = path.points[2];
          c2.y = path.points[3];
          end.x = path.points[4];
          end.y = path.points[5];
        }
        // 每个点的间隔距离
        const part = 1 / percent;
        // 声明侦测点
        const bzPoint = { x: null, y: null };
        // 声明贝兹曲线运动轨迹百分比 t
        let t = 0;
        // 循环 part 次，每次增加 part
        for (let t = 0; t < 1 - part; t += part) {
          // 计算直线坐标的值
          if (path.type === 'L') {
            const coor = _oneBezier(t, start, end);
            bzPoint.x = start.x * (1 - t) + end.x * t;
            bzPoint.y = start.y * (1 - t) + end.y * t;
          }
          if (path.type === 'C') {
            // 计算贝兹曲线坐标的值
            const coor = _threeBezier(t, start, c1, c2, end);
            bzPoint.x = coor.x;
            bzPoint.y = coor.y;
          }
          // 将贝兹曲线上的点拷贝到数组中
          detectPoints.push(JSON.parse(JSON.stringify(bzPoint)));
        }
      });
      return detectPoints;
    },
    // 对象移动事件
    movingObj(e) {
      if (!e.target) return;
      // 移动时清除点线
      _removeObj(this.canvas, 'bzPoint');
      _removeObj(this.canvas, 'line');
    },
    // 对象移动完毕事件
    movedObj(e) {
      const target = e.target;
      if (!target) return;
      // 记录偏移量，并修改位置
      this.distance.x = target.left - this.distance.x;
      this.distance.y = target.top - this.distance.y;
      // 找到当前点击的对象
      const targetData = this.findDataById(target.id);
      // 遍历出坐标位置
      targetData.coordinate.forEach(path => {
        path.points.forEach((point, index) => {
          // 判断是数组中的哪个点（x, y）并赋值
          path.points[index] += index % 2 === 0 ? this.distance.x : this.distance.y;
        });
      });
      // 判断当前对象的圆点是否显示中，如果在显示就重画
      if (targetData.showPoint) _drawLinePoint({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, movingPoint: this.movingPoint, movedPoint: this.movedPoint, movingControlPoint: this.movingControlPoint });
      // 添加侦测点
      targetData.detectPoints = this.createDetectPoints(targetData.coordinate);
    },

    // 计算线的长度
    lineLength(coordinate) {
      const startPoint = coordinate[0];
      const endPoint = coordinate[coordinate.length - 1];
      const start = {
        x: startPoint.points[0],
        y: startPoint.points[1]
      };
      const end = {
        x: endPoint.points[0],
        y: endPoint.points[1]
      }
      // 返回两点之间的距离
      return Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2));
    },

    // 贝兹曲线控制点 moving
    movingControlPoint(e) {
      const { data, top, left } = e.target;
      const targetData = this.findDataById(data.id);
      // 计算偏移量 
      // data.indexPath 的值，如果是开始点值为2，如果是终点值为0
      const offsert = {
        x: left - targetData.coordinate[data.indexPath].points[data.indexPoint],
        y: top - targetData.coordinate[data.indexPath].points[data.indexPoint + 1]
      };
      // 拿到当前移动的控制点的坐标
      const targetPath = targetData.coordinate[data.indexPath];
      // 修改坐标点的值
      targetPath.points[data.indexPoint] += offsert.x;
      targetPath.points[data.indexPoint + 1] += offsert.y;
      // 如果移动的是开始点
      if (data.indexPoint === 0) {
        // 拿到当前线控制点的坐标点
        const prevPath = targetData.coordinate[data.indexPath - 1];   
        // 如果是 C 类型的坐标点  
        if (prevPath && prevPath.type === 'C') {
          prevPath.points[2] = 2 * prevPath.points[4] - targetPath.points[data.indexPoint];
          prevPath.points[3] = 2 * prevPath.points[5] - targetPath.points[data.indexPoint + 1];
        };
      }
      // 如果移动的是终点
      if (data.indexPoint === 2) {
        const nextPath = targetData.coordinate[data.indexPath + 1]
        if (nextPath && nextPath.type === 'C') {
          nextPath.points[0] = 2 * targetPath.points[4] - targetPath.points[data.indexPoint];
          nextPath.points[1] = 2 * targetPath.points[5] - targetPath.points[data.indexPoint + 1];
        };
      }
      _drawPath({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, name: `path-${targetData.id}`, mousedown: this.mousedownObj, mousedbl: this.mousedblClick, movedObj: this.movedObj, movingObj: this.movingObj });
      _drawLinePoint({ canvas: this.canvas, coordinate: targetData.coordinate, id: targetData.id, movingPoint: this.movingPoint, movedPoint: this.movedPoint, movingControlPoint: this.movingControlPoint });
    },
    // 鼠标与对象的距离
    mouseDistanceObj() {
      // 最小距离
      let minDistance = 5;
      let detected = { point: null, id: null };
      this.allDatas.forEach(data => {
        // 遍历线上侦测点的坐标
        data.detectPoints.forEach(dp=> {
          // 计算两点之间的距离
          const dist = Math.sqrt(Math.pow(dp.x - this.mouse.position.x, 2) + Math.pow(dp.y - this.mouse.position.y, 2));
          
          // 如果距离小于最小距离,将点和id保存起来
          if (dist < minDistance) {
            detected.point = dp;
            detected.id = data.id;
          }
        });
      });
      if (detected.id) {
        this.activeObjId = detected.id;
        // 让鼠标点等于侦测点
        this.mouse.position.x = detected.point.x;
        this.mouse.position.y = detected.point.y;
      } else this.activeObjId = null;
    },

    // 根据ID删除物件
    deleteObj(id) {
      if (!id) return;
      // 根据ID删除对象
      const removeObjs = this.canvas._objects.filter(obj => obj.id === id);
      removeObjs.forEach(obj => this.canvas.remove(obj));
      // 删除数据组中的物件数据
      this.allDatas = this.allDatas.filter(data => data.id !== id);
    },
    // 通过ID寻找对象
    findObjById(id) {
      return this.canvas._objects.filter(data => data.id === id)[0];
    },
    // 从数组中找到data
    findDataById(id) {
      return this.allDatas.filter(data => data.id === id)[0];
    },

  }
});
