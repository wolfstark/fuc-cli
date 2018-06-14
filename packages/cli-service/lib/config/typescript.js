module.exports = (api, { parallel, lintOnSave }) => {
  const fs = require('fs');
  const useThreads = process.env.NODE_ENV === 'production' && parallel;
  const cacheDirectory = api.resolve('node_modules/.cache/cache-loader');

  api.chainWebpack((config) => {
    config
      .entry('app')
      .clear()
      .add('./src/main.ts');

    config.resolve.extensions.merge(['.ts', '.tsx']);

    const tsRule = config.module.rule('ts').test(/\.ts$/);
    const tsxRule = config.module.rule('tsx').test(/\.tsx$/);

    // add a loader to both *.ts & vue<lang="ts">
    const addLoader = ({ loader, options }) => {
      tsRule
        .use(loader)
        .loader(loader)
        .options(options);
      tsxRule
        .use(loader)
        .loader(loader)
        .options(options);
    };

    addLoader({
      loader: 'cache-loader',
      options: {
        cacheDirectory,
      },
    });
    if (useThreads) {
      addLoader({
        loader: 'thread-loader',
      });
    }

    if (api.hasPlugin('babel')) {
      addLoader({
        loader: 'babel-loader',
      });
    }
    addLoader({
      loader: 'ts-loader',
      options: {
        // 只负责编译，后续交给babel处理
        transpileOnly: true,
        appendTsSuffixTo: [/\.vue$/],
        // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
        happyPackMode: useThreads,
      },
    });
    // make sure to append TSX suffix
    tsxRule
      .use('ts-loader')
      .loader('ts-loader')
      .tap((options) => {
        /* eslint-disable no-param-reassign */
        options = Object.assign({}, options);
        delete options.appendTsSuffixTo;
        options.appendTsxSuffixTo = [/\.vue$/];
        /* eslint-enable no-param-reassign */
        return options;
      });

    config
      .plugin('fork-ts-checker')
      // 因为transpileOnly导致类型丢失，需要强化ts类型检查
      .use(require('fork-ts-checker-webpack-plugin'), [
        {
          // 用于处理.vue文件
          vue: true,
          tslint: lintOnSave !== false && fs.existsSync(api.resolve('tslint.json')),
          formatter: 'codeframe',
          // https://github.com/TypeStrong/ts-loader#happypackmode-boolean-defaultfalse
          // 当使用多线程模式时ts-loader不会检查语义错误
          checkSyntacticErrors: useThreads,
        },
      ]);
  });
};
