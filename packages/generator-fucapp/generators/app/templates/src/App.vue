<template>
  <div id="app">
    <img alt="Vue logo"
         src="./assets/images/logo.png">
    <slot></slot>
  </div>
</template>

<script>

export default {
  name: 'app',
};
</script>

<style lang="scss">
@import './assets/styles/base.scss';

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  animation-name: fadeInUp;
  animation-duration: 1s;
  animation-fill-mode: both;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 100%, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
