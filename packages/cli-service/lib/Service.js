const fs = require('fs');
const path = require('path');
const debug = require('debug');
const chalk = require('chalk');
const readPkg = require('read-pkg');
const merge = require('webpack-merge');
const Config = require('webpack-chain');
const PluginAPI = require('./PluginAPI');
const loadEnvConst = require('./util/loadEnvConst');
const defaultsDeep = require('lodash.defaultsdeep');
const { error, warn, isPlugin } = require('fuc-cli-utils');

const { defaults, validate } = require('./options');

function ensureSlash(config, key) {
  let val = config[key];
  if (typeof val === 'string') {
    // 不带协议确保使用当前项目路径
    if (!/^https?:/.test(val)) {
      val = val.replace(/^([^/.])/, '/$1');
    }
    // 确保路径后面有/
    // eslint-disable-next-line no-param-reassign
    config[key] = val.replace(/([^/])$/, '$1/');
  }
}

function removeSlash(config, key) {
  if (typeof config[key] === 'string') {
    // 前后有/时去掉
    // eslint-disable-next-line no-param-reassign
    config[key] = config[key].replace(/^\/|\/$/g, '');
  }
}
module.exports = class Service {
  constructor(context) {
    process.FUC_CLI_SERVICE = this;
    this.context = context;
    this.webpackChainFns = [];
    this.webpackRawConfigFns = [];
    this.devServerConfigFns = [];
    this.commands = {};
    this.pkg = this.resolvePkg(); //  没有则读取执行路径的package.json

    this.loadEnv();

    const userOptions = this.loadUserOptions();
    this.projectOptions = defaultsDeep(userOptions, defaults());

    debug('vue:project-config')(this.projectOptions);
    /**
     * 安装插件。
     *如果有内联插件，将使用它们而不是package.json中的那些插件。
     *当useBuiltIn === false时，内置插件被禁用。 这主要是为了测试。
     */
    this.plugins = this.resolvePlugins();
    this.plugins.forEach(({ id, apply }) => {
      apply(new PluginAPI(id, this), this.projectOptions);
    });
  }
  /**
   *
   *
   * @returns
   */
  resolvePlugins() {
    const idToPlugin = id => ({
      id: id.replace(/^.\//, 'built-in:'),
      apply: require(id), // eslint-disable-line global-require,import/no-dynamic-require
    });

    const builtInPlugins = [
      './commands/serve',
      './commands/build',
      './commands/inspect',
      './commands/help',
      // config plugins are order sensitive
      './config/base',
      './config/css',
      './config/dev',
      './config/prod',
      './config/app',
    ].map(idToPlugin);
    const projectPlugins = Object.keys(this.pkg.dependencies || {})
      .concat(Object.keys(this.pkg.devDependencies || {}))
      .filter(isPlugin)
      .map(idToPlugin);
    return builtInPlugins.concat(projectPlugins);
  }
  loadUserOptions() {
    // fuc.config.js
    let fileConfig;
    let pkgConfig;
    let resolved;
    let resovledFrom;
    const configPath = path.resolve(this.context, 'fuc.config.js');

    if (fs.existsSync(configPath)) {
      try {
        // eslint-disable-next-line
        fileConfig = require(configPath);
        if (!fileConfig || typeof fileConfig !== 'object') {
          error(`Error loading ${chalk.bold('fuc.config.js')}: should export an object.`);
          fileConfig = null;
        }
      } catch (e) {
        error(`Error loading ${chalk.bold('fuc.config.js')}:`);
        throw e;
      }
    }

    // package.vue
    pkgConfig = this.pkg.vue;
    if (pkgConfig && typeof pkgConfig !== 'object') {
      error(`Error loading vue-cli config in ${chalk.bold('package.json')}: ` +
          'the "vue" field should be an object.');
      pkgConfig = null;
    }

    if (fileConfig) {
      // 优先取fuc.config.js
      if (pkgConfig) {
        warn('"vue" field in package.json ignored ' +
            `due to presence of ${chalk.bold('fuc.config.js')}.`);
        warn(`You should migrate it into ${chalk.bold('fuc.config.js')} ` +
            'and remove it from package.json.');
      }
      resolved = fileConfig;
      resovledFrom = 'fuc.config.js';
    } else if (pkgConfig) {
      resolved = pkgConfig;
      resovledFrom = '"vue" field in package.json';
    } else {
      resolved = {};
      resovledFrom = 'inline options';
    }

    // normlaize some options
    ensureSlash(resolved, 'baseUrl');
    removeSlash(resolved, 'outputDir');

    // validate options
    validate(resolved, (msg) => {
      error(`Invalid options in ${chalk.bold(resovledFrom)}: ${msg}`);
    });

    return resolved;
  }
  resolvePkg() {
    if (fs.existsSync(path.join(this.context, 'package.json'))) {
      return readPkg.sync(this.context);
    }
    return {};
  }
  loadEnv(mode) {
    const logger = debug('fuc:env');
    const basePath = path.resolve(this.context, `.env${mode ? `${mode}` : ''}`);
    const localPath = `${basePath}.local`;
    // eslint-disable-next-line no-shadow
    const load = (path) => {
      try {
        const res = loadEnvConst(path);
        logger(path, res);
      } catch (err) {
        if (err.toString().indexOf('ENOENT') === -1) {
          error(err);
        }
      }
    };

    load(basePath);
    load(localPath);
  }
  resolveChainableWebpackConfig() {}
  resolveWebpackConfig(chainableConfig = this.resolveChainableWebpackConfig()) {
    // let config = chi
  }
};
