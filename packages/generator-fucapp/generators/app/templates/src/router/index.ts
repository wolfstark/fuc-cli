import Vue from 'vue';
import Router, { RouteConfig } from 'vue-router';
import { importAll } from '../assets/scripts/utils/import';
import { toKebabCase } from '../assets/scripts/utils/string';

Vue.use(Router);

/** Folder routing map
 * --views
 * ----Home -> /home
 * ------HomeMain -> /home/home-main
 * @param {String} path
 * @returns {RouteConfig}
 */
function routeFactory(path: String) {
  const arr = path.split('/');
  arr.shift();
  arr.pop();

  return {
    path: `/${arr.map(p => toKebabCase(p)).join('/')}`,
    name: arr.join(''),
    component: () => import(`../views${path.slice(1)}`),
  } as RouteConfig;
}

const asyncRouterMap = importAll(require.context('../views/', true, /\.vue$/), routeFactory);

const constantRouterMap: RouteConfig[] = [
  {
    path: '/',
    redirect: { name: 'Home' },
  },
  { path: '*', redirect: { name: '404' } },
];

export default new Router({
  routes: asyncRouterMap.concat(constantRouterMap),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { x: 0, y: 0 };
  },
});
