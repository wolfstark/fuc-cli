module.exports = (api, options) => {
  const useThreads = process.env.NODE_ENV === 'production' && options.parallel;
  const cliServicePath = require('path').dirname(require.resolve('@fuc/cli-service'));

  api.chainWebpack((webpackConfig) => {
    const jsRule = webpackConfig.module
      .rule('js')
      .test(/\.jsx?$/)
      .exclude
      .add((filepath) => {
        // 总是在vue文件中转换js
        if (/\.vue\.jsx?$/.test(filepath)) {
          return false;
        }
        // 从cli-service中排除动态条目
        if (filepath.startsWith(cliServicePath)) {
          return true;
        }
        // 检查这是否是用户明确想要转换的内容
        if (options.transpileDependencies.some(dep => filepath.match(dep))) {
          return false;
        }
        // 不要转换node_modules
        return /node_modules/.test(filepath);
      })
      .end()
      .use('cache-loader')
      .loader('cache-loader')
      .options(api.genCacheConfig('babel-loader', {
        '@babel/core': require('@babel/core/package.json').version,
        '@vue/babel-preset-app': require('@vue/babel-preset-app').version,
        'babel-loader': require('babel-loader/package.json').version,
        modern: !!process.env.VUE_CLI_MODERN_BUILD,
        browserslist: api.service.pkg.browserslist,
      }, [
        'babel.config.js',
        '.browserslistrc',
      ]))
      .end();

    if (useThreads) {
      jsRule
        .use('thread-loader')
        .loader('thread-loader');
    }

    jsRule
      .use('babel-loader')
      .loader('babel-loader');
  });
};
