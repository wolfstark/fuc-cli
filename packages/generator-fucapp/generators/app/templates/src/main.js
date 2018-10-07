import Vue from 'vue';
import 'normalize.css';
import 'babel-polyfill';
import './registerServiceWorker';
import * as filters from './assets/scripts/filters'; // global filters
import './assets/scripts/utils/rem';

Vue.config.productionTip = false;

// 注册过滤器
Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key]);
});
