module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    if (process.env.NODE_ENV === 'development') {
      webpackConfig
        .mode('development');

      webpackConfig
        .devtool('cheap-module-eval-source-map')
        .output
        .publicPath('/');

      webpackConfig
        .plugin('hmr')
        .use(require('webpack/lib/HotModuleReplacementPlugin'));

      // 热加载时返回模块名而不是id
      webpackConfig
        .plugin('named-modules')
        .use(require('webpack/lib/NamedModulesPlugin'));

      // webpack编译出错时不再中断编译
      webpackConfig
        .plugin('no-emit-on-errors')
        .use(require('webpack/lib/NoEmitOnErrorsPlugin'));

      if (options.devServer.progress !== false) {
        webpackConfig
          .plugin('progress')
          .use(require('webpack/lib/ProgressPlugin'));
      }
    }
  });
};
