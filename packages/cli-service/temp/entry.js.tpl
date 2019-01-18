import '@/main.js';
import Vue from 'vue';
import Page from '@/{{{routePath}}}';
import App from '@/App.vue'

new Vue({
  render: function render(h){
    return h(App, [h(Page)]);
  },
}).$mount('#root');