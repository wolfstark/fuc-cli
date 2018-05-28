module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    const resolveLocal = require('../util/resolveLocal');
    const getAssetPath = require('../util/getAssetPath');
    const inlineLimit = 10000;

    webpackConfig
      .context(api.service.context)
      .entry('app')
      .add('./src/main.js')
      .end()
      .output
      .path(api.resolve(options.outputDir))
      .filename('[name].js')
      .publicPath(options.baseUrl);

    webpackConfig.resolve
      .set('symlinks', true)
      .extensions
      .merge(['.js', '.jsx', '.vue', '.json'])
      .end()
      .modules
      .add('node_modules')
      .add(api.resolve('node_modules'))
      .add(resolveLocal('node_modules'))
      .end()
      .alias
      .set('@', api.resolve('src'))
      .set('vue$', options.compiler ? 'vue/dist/vue.esm.js' : 'vue/dist/vue.runtime.esm.js');

    webpackConfig.resolveLoader
      .set('symlinks', true)
      .modules
      .add('node_modules')
      .add(api.resolve('node_modules'))
      .add(resolveLocal('node_modules'));

    webpackConfig.module
      .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/);

    // js is handled by cli-plugin-bable ---------------------------------------

    // vue-loader --------------------------------------------------------------

    webpackConfig.module
      .rule('vue')
      .test(/\.vue$/)
      .use('vue-loader')
      .loader('vue-loader')
      .options({
        compilerOptions: {
          preserveWhitespace: false,
        },
      });

    webpackConfig
      .plugin('vue-loader')
      .use(require('vue-loader/lib/plugin'));

    // static assets -----------------------------------------------------------

    webpackConfig.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: getAssetPath(options, 'img/[name].[hash:8].[ext]'),
      });

    // do not base64-inline SVGs.
    // https://github.com/facebookincubator/create-react-app/pull/1180
    webpackConfig.module
      .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: getAssetPath(options, 'img/[name].[hash:8].[ext]'),
      });

    webpackConfig.module
      .rule('media')
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: getAssetPath(options, 'media/[name].[hash:8].[ext]'),
      });

    webpackConfig.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: inlineLimit,
        name: getAssetPath(options, 'fonts/[name].[hash:8].[ext]'),
      });

    // Other common pre-processors ---------------------------------------------

    webpackConfig.module
      .rule('pug')
      .test(/\.pug$/)
      .use('pug-plain-loader')
      .loader('pug-plain-loader')
      .end();

    // shims

    webpackConfig.node
      .merge({
        // prevent webpack from injecting useless setImmediate polyfill because Vue
        // source contains it (although only uses it if it's native).
        setImmediate: false,
        // process is injected via DefinePlugin, although some 3rd party
        // libraries may require a mock to work properly (#934)
        process: 'mock',
        // prevent webpack from injecting mocks to Node native modules
        // that does not make sense for the client
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
      });

    const resolveClientEnv = require('../util/resolveClientEnv');
    webpackConfig
      .plugin('define')
      .use(require('webpack/lib/DefinePlugin'), [
        resolveClientEnv(options.baseUrl),
      ]);

    webpackConfig
      .plugin('case-sensitive-paths')
      .use(require('case-sensitive-paths-webpack-plugin'));

    // friendly error plugin displays very confusing errors when webpack
    // fails to resolve a loader, so we provide custom handlers to improve it
    const {
      transformer,
      formatter,
    } = require('../util/resolveLoaderError');
    webpackConfig
      .plugin('friendly-errors')
      .use(require('friendly-errors-webpack-plugin'), [{
        additionalTransformers: [transformer],
        additionalFormatters: [formatter],
      }]);
  });
};
