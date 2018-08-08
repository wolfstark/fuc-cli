import '@/main.ts';
import Vue from 'vue';
import App from '@/{{{routePath}}}';

new Vue({
  render: h => h(App),
}).$mount('#app');
