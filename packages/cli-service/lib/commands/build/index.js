const defaults = {
  target: 'app',
  entry: 'src/App.vue',
};

const buildModes = {
  lib: 'library (commonjs + umd)',
  wc: 'web component',
  'wc-async': 'web component (async)',
};

module.exports = (api, options) => {
  api.registerCommand(
    'build', {
      description: 'build for production',
      usage: 'vue-cli-service build [options] [entry|pattern]',
      options: {
        '--mode': 'specify env mode (default: production)',
        '--watch': 'watch for changes',
      },
    },
    async (args) => {
      /* eslint-disable */
      // config合成
      args.entry = args.entry || args._[0];
      for (const key in defaults) {
        if (args[key] == null) {
          args[key] = defaults[key];
        }
      }
      /* eslint-enable */
      const fs = require('fs-extra');
      const path = require('path');
      const chalk = require('chalk');
      const webpack = require('webpack');
      const formatStats = require('./formatStats');
      const {
        log,
        done,
        info,
        logWithSpinner,
        stopSpinner,
      } = require('fuc-cli-utils');

      log();
      const {
        mode,
      } = api.service;
      if (args.target === 'app') {
        logWithSpinner(`Building for ${mode}...`);
      } else {
        const buildMode = buildModes[args.target];
        if (buildMode) {
          logWithSpinner(`Building for ${mode} as ${buildMode}...`);
        } else {
          throw new Error(`Unknown build target: ${args.target}`);
        }
      }

      const targetDir = api.resolve(args.dest || options.outputDir);

      // respect inline build destination in copy plugin
      if (args.dest) {
        api.chainWebpack((config) => {
          if (args.target === 'app') {
            config.plugin('copy').tap((_args) => {
              _args[0][0].to = targetDir; // eslint-disable-line no-param-reassign
              return _args;
            });
          }
        });
      }

      // resolve raw webpack config
      let webpackConfig;
      if (args.target === 'lib') {
        webpackConfig = require('./resolveLibConfig')(api, args, options);
      } else if (args.target === 'wc' || args.target === 'wc-async') {
        webpackConfig = require('./resolveWcConfig')(api, args, options);
      } else {
        webpackConfig = api.resolveWebpackConfig();
      }

      // 内联命令配置优先
      if (args.dest) {
        const applyDest = (config) => {
          config.output.path = targetDir; // eslint-disable-line no-param-reassign
        };
        if (Array.isArray(webpackConfig)) {
          webpackConfig.forEach(applyDest);
        } else {
          applyDest(webpackConfig);
        }
      }

      // grab the actual output path and check for common mis-configuration
      const actualTargetDir = (Array.isArray(webpackConfig) ? webpackConfig[0] : webpackConfig)
        .output.path;

      if (args.watch) {
        webpackConfig.watch = true;
      }
      // 避免之前的插件在构建之前修改output
      if (!args.dest && actualTargetDir !== api.resolve(options.outputDir)) {
        console.error(chalk.red('\n\nConfiguration Error: ' +
          'Avoid modifying webpack output.path directly. ' +
          'Use the "outputDir" option instead.\n'));
        process.exit(1);
      }
      // 不允许输出到根目录
      if (actualTargetDir === api.service.context) {
        console.error(chalk.red('\n\nConfiguration Error: ' + 'Do not set output directory to project root.\n'));
        process.exit(1);
      }
      // clear dest
      await fs.remove(targetDir);

      return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
          stopSpinner(false);
          if (err) {
            return reject(err);
          }

          if (stats.hasErrors()) {
            return reject('Build failed with errors.');
          }

          // if (!args.silent) {
          const targetDirShort = path.relative(api.service.context, targetDir);
          log(formatStats(stats, targetDirShort, api));
          if (args.target === 'app') {
            if (!args.watch) {
              done(`Build complete. The ${chalk.cyan(targetDirShort)} directory is ready to be deployed.\n`);
            } else {
              done('Build complete. Watching for changes...');
            }
            if (
              options.baseUrl === '/' &&
              // 如果这是第一次构建，只记录提示
              !fs.existsSync(api.resolve('node_modules/.cache'))
            ) {
              info('The app is built assuming that it will be deployed at the root of a domain.');
              info(`If you intend to deploy it under a subpath, update the ${chalk.green('baseUrl')} option`);
              info(`in your project config (${chalk.cyan('vue.config.js')} or ${chalk.green('"vue"')} field in ${chalk.cyan('package.json')}).\n`);
            }
          }
          // }

          resolve();
        });
      });
    },
  );
};

module.exports.defaultModes = {
  build: 'production',
};
