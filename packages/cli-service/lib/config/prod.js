module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    if (process.env.NODE_ENV === 'production') {
      const getAssetPath = require('../util/getAssetPath');

      webpackConfig
        .mode('production')
        .devtool('source-map')
        .output
        .filename(getAssetPath(options, 'js/[name].[chunkhash:8].js'))
        // async chunk
        .chunkFilename(getAssetPath(options, 'js/[name].[chunkhash:8].js'));

      // issues: https://github.com/sorrycc/roadhog/issues/510
      // webpack 模块 ID 默认是按照依赖顺序递增分配的，
      // 这会使得增加会删除一个模块时，其他模块id也被修改，
      // vender hash变更,导致浏览器缓存失效。
      // 该插件会根据模块的相对路径生成一个四位数的hash作为模块id
      webpackConfig
        .plugin('hash-module-ids')
        .use(require('webpack/lib/HashedModuleIdsPlugin'));

      const UglifyPlugin = require('uglifyjs-webpack-plugin');
      const uglifyOptions = require('./uglifyOptions');
      webpackConfig.optimization.minimizer([
        new UglifyPlugin(uglifyOptions(options)),
      ]);
    }
  });
};
