module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    if (process.env.NODE_ENV === 'production') {
      const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD;
      const getAssetPath = require('../util/getAssetPath');
      const filename = getAssetPath(
        options,
        `js/[name]${isLegacyBundle ? '-legacy' : ''}${options.filenameHashing ? '.[contenthash:8]' : ''}.js`,
      );

      webpackConfig
        .mode('production')
        .devtool(options.productionSourceMap ? 'source-map' : false)
        .output
        .filename(filename)
        .chunkFilename(filename);

      // webpack 模块 ID 默认是按照依赖顺序递增分配的，
      // 这会使得增加或删除一个模块时，其他模块id也被修改，
      // vender hash变更,导致浏览器缓存失效。
      // 该插件会根据模块的相对路径生成一个四位数的hash作为模块id
      webpackConfig
        .plugin('hash-module-ids')
        .use(require('webpack/lib/HashedModuleIdsPlugin'), [{
          hashDigest: 'hex',
        }]);

      // disable optimization during tests to speed things up
      if (process.env.VUE_CLI_TEST) {
        webpackConfig.optimization.minimize(false);
      } else {
        const UglifyPlugin = require('uglifyjs-webpack-plugin');
        const uglifyOptions = require('./uglifyOptions');
        webpackConfig.optimization.minimizer([
          new UglifyPlugin(uglifyOptions(options)),
        ]);
      }
    }
  });
};
