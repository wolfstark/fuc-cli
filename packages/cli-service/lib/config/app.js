// config that are specific to --target app

module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    // FUC_CLI_TARGET = lib | web-component default = null
    if (process.env.FUC_CLI_TARGET) {
      return;
    }

    // HTML plugin
    const resolveClientEnv = require('../util/resolveClientEnv');
    const htmlOptions = {
      templateParameters: (compilation, assets, pluginOptions) => {
        // enhance html-webpack-plugin's built in template params
        let stats;

        // process.stdout.write(compilation, assets, pluginOptions);

        return Object.assign({
          // make stats lazy as it is expensive
          get webpack() {
            stats = stats || compilation.getStats().toJson();
            return stats;
          },
          compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            files: assets,
            options: pluginOptions,
          },
        }, resolveClientEnv(options.baseUrl, true /* raw */));
      },
    };
    // only set template path if index.html exists
    const htmlPath = api.resolve('public/index.html');
    if (require('fs').existsSync(htmlPath)) {
      htmlOptions.template = htmlPath;
    }

    webpackConfig
      .plugin('html')
      .use(require('html-webpack-plugin'), [htmlOptions]);

    // inject preload/prefetch to HTML
    const PreloadPlugin = require('preload-webpack-plugin');
    webpackConfig
      .plugin('preload')
      .use(PreloadPlugin, [{
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [/\.map$/, /hot-update\.js$/],
      }]);

    webpackConfig
      .plugin('prefetch')
      .use(PreloadPlugin, [{
        rel: 'prefetch',
        include: 'asyncChunks',
      }]);

    // copy static assets in public/
    webpackConfig
      .plugin('copy')
      .use(require('copy-webpack-plugin'), [
        [{
          from: api.resolve('public'),
          to: api.resolve(options.outputDir),
          ignore: ['index.html', '.DS_Store'],
        }],
      ]);

    if (process.env.NODE_ENV === 'production') {
      // minify HTML
      webpackConfig
        .plugin('html')
        .tap(([option]) => [Object.assign(option, {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
          },
          // necessary to consistently work with multiple chunks via CommonsChunkPlugin
          chunksSortMode: 'dependency',
        })]);

      webpackConfig
        // webpack4 所有的公共chunks都将被抽取
        .optimization.splitChunks({
          chunks: 'all',
        });
    }
  });
};
