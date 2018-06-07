const path = require('path');

const defaultPolyfills = [
  'es6.promise',
];
// TODO: 应该为不同环境提供预设的browserlist
/**
 * 通过targets环境决定polyfills是否需要注入
 *
 * @param {object} targets browserlist
 * @param {[]:string} includes polyfills
 * @param {object} {
 *   ignoreBrowserslistConfig,
 *   configPath,
 * }
 * @returns
 */
function getPolyfills(targets, includes, {
  ignoreBrowserslistConfig,
  configPath,
}) {
  const {
    isPluginRequired,
  } = require('@babel/preset-env');
  const builtInsList = require('@babel/preset-env/data/built-ins.json');
  const getTargets = require('@babel/preset-env/lib/targets-parser').default;
  const builtInTargets = getTargets(targets, {
    ignoreBrowserslistConfig,
    configPath,
  });

  return includes.filter(item => isPluginRequired(builtInTargets, builtInsList[item]));
}

module.exports = (context, options = {}) => {
  const presets = [];
  const plugins = [];

  // JSX
  if (options.jsx !== false) {
    plugins.push(
      require('@babel/plugin-syntax-jsx'),
      require('babel-plugin-transform-vue-jsx'),
      // require('babel-plugin-jsx-event-modifiers'),
      // require('babel-plugin-jsx-v-model')
    );
  }

  const {
    polyfills: userPolyfills,
    loose = false,
    useBuiltIns = 'usage',
    modules = false,
    targets: rawTargets,
    spec,
    ignoreBrowserslistConfig,
    configPath,
    include,
    exclude,
    shippedProposals,
    forceAllTransforms,
    decoratorsLegacy,
  } = options;

  const targets = rawTargets;

  // 引入默认的polyfill列表，因为useBuiltIns === 'usage'，当第三方依赖存在helper需求时，不会被引入
  let polyfills;
  const buildTarget = 'app';
  if (buildTarget === 'app' && useBuiltIns === 'usage') {
    polyfills = getPolyfills(targets, userPolyfills || defaultPolyfills, {
      ignoreBrowserslistConfig,
      configPath,
    });
    plugins.push([require('./polyfillsPlugin'), {
      polyfills,
    }]);
  } else {
    polyfills = [];
  }
  // useBuiltIns:true 实现动态按需加载
  const envOptions = {
    spec,
    loose,
    modules,
    targets,
    useBuiltIns,
    ignoreBrowserslistConfig,
    configPath,
    include,
    exclude: polyfills.concat(exclude || []),
    shippedProposals,
    forceAllTransforms,
  };

  // cli-plugin-jest sets this to true because Jest runs without bundling
  // if (process.env.VUE_CLI_BABEL_TRANSPILE_MODULES) {
  //   envOptions.modules = 'commonjs'
  //   // necessary for dynamic import to work in tests
  //   plugins.push(require('babel-plugin-dynamic-import-node'))
  // }

  presets.push([require('@babel/preset-env'), envOptions]);

  // stage 2. This includes some important transforms, e.g. dynamic import and rest object spread.
  presets.push([require('@babel/preset-stage-2'), {
    loose,
    useBuiltIns: useBuiltIns !== false,
    decoratorsLegacy: decoratorsLegacy !== false,
  }]);

  // 为辅助函数转换runtime
  plugins.push([require('@babel/plugin-transform-runtime'), {
    polyfill: false,
    regenerator: useBuiltIns !== 'usage',
    useBuiltIns: useBuiltIns !== false,
    useESModules: true,
    moduleName: path.dirname(require.resolve('@babel/runtime/package.json')),
  }]);

  return {
    presets,
    plugins,
  };
};
