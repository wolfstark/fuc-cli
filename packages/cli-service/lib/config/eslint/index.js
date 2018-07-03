function genCacheIdentifier(context) {
  const fs = require('fs');
  const path = require('path');
  const files = [
    '.eslintrc.js',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    '.eslintrc.json',
    '.eslintrc',
    'package.json',
  ];

  const configTimeStamp = (() => {
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      if (fs.existsSync(path.join(context, file))) {
        // 最有一次修改的时间戳
        return fs.statSync(file).mtimeMs;
      }
    }
    return undefined;
  })();

  // 缓存标志，模块版本和配置文件都没有变更则应用缓存
  return JSON.stringify({
    'eslint-loader': require('eslint-loader/package.json').version,
    eslint: require('eslint/package.json').version,
    config: configTimeStamp,
  });
}


module.exports = (api, {
  lintOnSave,
}) => {
  if (lintOnSave) {
    const extensions = require('./eslintOptions').extensions(api);
    const cacheIdentifier = genCacheIdentifier(api.resolve('.'));
    const resolveLocal = require('../../util/resolveLocal');

    api.chainWebpack((webpackConfig) => {
      webpackConfig.module
        .rule('eslint')
        .pre()
        .exclude
        .add(/node_modules/)
        .add(resolveLocal('lib'))
        // .add(require('path').dirname(require.resolve('fuc-cli-service')))
        .end()
        .test(/\.(vue|(j|t)sx?)$/)
        .use('eslint-loader')
        .loader('eslint-loader')
        .options({
          extensions,
          cache: true,
          cacheIdentifier,
          emitWarning: lintOnSave !== 'error',
          formatter: require('eslint/lib/formatters/codeframe'),
        });
    });
  }

  api.registerCommand('lint', {
    description: 'lint and fix source files',
    usage: 'fuc-cli-service lint [options] [...files]',
    options: {
      '--format [formatter]': 'specify formatter (default: codeframe)',
      '--no-fix': 'do not fix errors',
      '--max-errors [limit]': 'specify number of errors to make build failed (default: 0)',
      '--max-warnings [limit]': 'specify number of warnings to make build failed (default: Infinity)',
    },
    details: 'For more options, see https://eslint.org/docs/user-guide/command-line-interface#options',
  }, (args) => {
    require('./lint')(args, api);
  });
};

// eslint-loader doesn't bust cache when eslint config changes
// so we have to manually generate a cache identifier that takes the config
// into account.
