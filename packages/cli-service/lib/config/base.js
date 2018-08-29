module.exports = (api, options) => {
  api.chainWebpack((webpackConfig) => {
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD;
    const isProduction = process.env.NODE_ENV === 'production';
    const resolveLocal = require('../util/resolveLocal');
    const getAssetPath = require('../util/getAssetPath');
    const inlineLimit = 4096;

    const genAssetSubPath = dir => getAssetPath(options, dir);
    const genFileName = () => `[name]${options.filenameHashing ? '.[hash:8]' : ''}.[ext]`;

    const genUrlLoaderOptions = dir => ({
      limit: inlineLimit,
      // url-loader>=1.1.0 fallback使用object
      fallback: {
        loader: 'file-loader',
        options: {
          name: require('path').join(genAssetSubPath(dir), genFileName()),
        },
      },
    });
    const genCdnUrlLoaderOptions = (dir, cdnPath) => ({
      limit: inlineLimit,
      // url-loader>=1.1.0 fallback使用object
      fallback: {
        loader: 'file-loader',
        options: {
          // 只有使用cdn时才需要将outputPath和name分离，build时的资源定位会忽略outputPath
          publicPath: isProduction ? cdnPath + options.baseUrl : null,
          outputPath: genAssetSubPath(dir),
          name: genFileName(),
        },
      },
    });

    webpackConfig
      .mode('development')
      .context(api.service.context)
      .entry('app')
      .add('./src/main.js')
      .end()
      .output
      .path(api.resolve(options.outputDir))
      .filename(isLegacyBundle ? '[name]-legacy.js' : '[name].js')
      .publicPath(options.baseUrl);

    webpackConfig.resolve
      .set('symlinks', false)
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
      .set(
        'vue$',
        options.runtimeCompiler ?
          'vue/dist/vue.esm.js' :
          'vue/dist/vue.runtime.esm.js',
      );

    webpackConfig.resolveLoader
      .modules
      .add('node_modules')
      .add(api.resolve('node_modules'))
      .add(resolveLocal('node_modules'));

    webpackConfig.module
      .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/);

    // js is handled by cli-plugin-babel ---------------------------------------

    // vue-loader --------------------------------------------------------------
    const vueLoaderCacheConfig = api.genCacheConfig('vue-loader', {
      'vue-loader': require('vue-loader/package.json').version,
      /* eslint-disable-next-line node/no-extraneous-require */
      '@vue/component-compiler-utils': require('@vue/component-compiler-utils/package.json').version,
      'vue-template-compiler': require('vue-template-compiler/package.json').version,
    });

    webpackConfig.module
      .rule('vue')
      .test(/\.vue$/)
      .use('cache-loader')
      .loader('cache-loader')
      .options(vueLoaderCacheConfig)
      .end()
      .use('vue-loader')
      .loader('vue-loader')
      .options(Object.assign({
        compilerOptions: {
          preserveWhitespace: false,
        },
      }, vueLoaderCacheConfig));

    webpackConfig
      .plugin('vue-loader')
      .use(require('vue-loader/lib/plugin'));

    // static assets -----------------------------------------------------------

    webpackConfig.module
      .rule('images')
      .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options(genCdnUrlLoaderOptions('img', options.imgUrl));

    // do not base64-inline SVGs.
    // https://github.com/facebookincubator/create-react-app/pull/1180
    webpackConfig.module
      .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        // 所有图片资源都使用cdn,需要通过outputPath忽略本地路径
        outputPath: genAssetSubPath('img'),
        name: genFileName(),
      });

    webpackConfig.module
      .rule('media')
      .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
      .use('url-loader')
      .loader('url-loader')
      .options(genUrlLoaderOptions('media'));

    webpackConfig.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options(genUrlLoaderOptions('fonts'));

    // Other common pre-processors ---------------------------------------------

    webpackConfig.module
      .rule('pug')
      .test(/\.pug$/)
      .use('pug-plain-loader')
      .loader('pug-plain-loader')
      .end();

    // node在前端文件中的shims，除了process，通常无用
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
        resolveClientEnv(options),
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
