const {
  createSchema,
  validate,
} = require('fuc-cli-utils');

const schema = createSchema(joi => joi.object({
  baseUrl: joi.string(),
  outputDir: joi.string(),
  assetsDir: joi.string(),
  compiler: joi.boolean(),
  transpileDependencies: joi.array(),
  productionSourceMap: joi.boolean(),
  parallel: joi.boolean(),
  devServer: joi.object(),

  // css
  css: joi.object({
    localIdentName: joi.string(),
    extract: joi.alternatives().try(joi.boolean(), joi.object()),
    sourceMap: joi.boolean(),
    loaderOptions: joi.object({
      sass: joi.object(),
      less: joi.object(),
      stylus: joi.object(),
    }),
  }),

  // webpack
  chainWebpack: joi.func(),
  configureWebpack: joi.alternatives().try(
    joi.object(),
    joi.func(),
  ),

  // known runtime options for built-in plugins
  lintOnSave: joi.any().valid([true, false, 'error']),
  pwa: joi.object(),

  // 3rd party plugin options
  pluginOptions: joi.object(),
}));
exports.validate = (options, cb) => {
  validate(options, schema, cb);
};

exports.defaults = () => ({
  // project deployment base
  baseUrl: '/',

  // where to output built files
  outputDir: 'dist',

  // boolean, use full build?
  compiler: false,

  // vue-loader options
  vueLoader: {
    preserveWhitespace: false,
    template: {
      // for pug
      doctype: 'html',
    },
  },

  // sourceMap for production build?
  productionSourceMap: true,

  // use thread-loader for babel & TS in production build
  // enabled by default if the machine has more than 1 cores
  // eslint-disable-next-line global-require
  parallel: require('os').cpus().length > 1,

  // split vendors using autoDLLPlugin?
  // can be an explicit list of dependencies to include in the DLL chunk.
  dll: false,

  css: {
    // extract: true,
    // modules: false,
    // localIdentName: '[name]_[local]_[hash:base64:5]',
    // sourceMap: false,
    // loaderOptions: {}
  },

  // whether to use eslint-loader
  lintOnSave: true,

  devServer: {
    /*
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    proxy: null, // string | Object
    before: app => {}
  */
  },
});
