import Vue from 'vue';
import 'normalize.css'
import 'babel-polyfill'
import './registerServiceWorker';
import * as filters from './assets/scripts/filters'; // global filters

document.documentElement.style.fontSize = `${document.documentElement.clientWidth / 7.5}px`;

Vue.config.productionTip = false;

// 注册过滤器
Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key]);
});