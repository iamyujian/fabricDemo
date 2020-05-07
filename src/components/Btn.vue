<template>
  <div id="btn">
    <div class="active" @click="hand">Hand</div>
    <div @click="bezierCurve">BezierCurve</div>
    <div @click="line">Line</div>
    <div @click="detect">Detect</div>
    <div @click="detele">Detele</div>
    <span class="langth"></span>
  </div>
</template>

<script>
export default {
  name: "Btn",
  methods: {
    hand() {
      this.$emit('btnClick','Hand')
    },
    bezierCurve() {
      this.$emit('btnClick','BezierCurve')
    },
    line() {
      this.$emit('btnClick','Line')
    },
    detect() {
      this.$emit('btnClick','Detect')
    },
    detele() {
      this.$emit('btnClick','Detele')
    }
  }
};
</script>

<style scrope>
#btn {
  display: flex;
}
#btn div {
  background-color: #EEEEEC;
  margin-left: 20px;
  /* margin-top: 20px; */
  padding: 0 10px;
  border: 1px #999 solid;
  height: 100%;
  border-radius: 5px;
  cursor: pointer;
}
.active{
  border-color: blue!important;
  color: blue;
}
</style>