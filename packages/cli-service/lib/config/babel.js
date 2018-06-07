module.exports = (api, {
  parallel,
  transpileDependencies,
}) => {
  const useThreads = process.env.NODE_ENV === 'production' && parallel;
  const cacheDirectory = api.resolve('node_modules/.cache/cache-loader');
  const cliServicePath = require('path').dirname(require.resolve('@vue/cli-service'));

  api.chainWebpack((webpackConfig) => {
    const jsRule = webpackConfig.module
      .rule('js')
      .test(/\.jsx?$/)
      .exclude
      .add((filepath) => {
        // 总是编译vue文件
        if (/\.vue\.jsx?$/.test(filepath)) {
          return false;
        }
        // exclude dynamic entries from cli-service
        if (filepath.startsWith(cliServicePath)) {
          return true;
        }
        // 白名单中的依赖将会被babel编译
        if (transpileDependencies.some(dep => filepath.match(dep))) {
          return false;
        }
        return /node_modules/.test(filepath);
      })
      .end()
      .use('cache-loader')
      .loader('cache-loader')
      .options({
        cacheDirectory,
      })
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
