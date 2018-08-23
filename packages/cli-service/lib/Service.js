const fs = require('fs');
const path = require('path');
const debug = require('debug');
const chalk = require('chalk');
const readPkg = require('read-pkg');
const merge = require('webpack-merge');
const Config = require('webpack-chain');
const defaultsDeep = require('lodash.defaultsdeep');
const PluginAPI = require('./PluginAPI');
const loadEnvConst = require('./util/loadEnvConst');
const {
  error,
  warn,
  isPlugin,
} = require('fuc-cli-utils');

const {
  defaults,
  validate,
} = require('./options');
/**
 * @example
 *foo/fun -> /foo/fun/
 *
 * @param {any} config
 * @param {any} key
 */
function ensureSlash(config, key) {
  let val = config[key];
  if (typeof val === 'string') {
    // 不带协议确保使用当前项目路径
    if (!/^https?:/.test(val)) {
      // 首字符不包含/.则添加/
      val = val.replace(/^([^/.])/, '/$1');
    }
    // 确保路径后面有/
    // eslint-disable-next-line no-param-reassign
    config[key] = val.replace(/([^/])$/, '$1/');
  }
}

function removeSlash(config, key) {
  if (typeof config[key] === 'string') {
    // 去掉尾部/
    // eslint-disable-next-line no-param-reassign
    config[key] = config[key].replace(/\/$/g, '');
  }
}

function cloneRuleNames(to, from) {
  if (!to || !from) {
    return;
  }
  from.forEach((r, i) => {
    if (to[i]) {
      Object.defineProperty(to[i], '__ruleNames', {
        value: r.__ruleNames,
      });
      cloneRuleNames(to[i].oneOf, r.oneOf);
    }
  });
}
module.exports = class Service {
  constructor(context) {
    process.VUE_CLI_SERVICE = this;
    this.initialized = false;
    this.context = context;
    this.webpackChainFns = [];
    this.webpackRawConfigFns = [];
    this.devServerConfigFns = [];
    this.commands = {};
    this.pkgContext = context;
    this.pkg = this.resolvePkg(); //  没有则读取执行路径的package.json

    /**
     * 安装插件。
     *如果有内联插件，将使用它们而不是package.json中的那些插件。
     *当useBuiltIn === false时，内置插件被禁用。 这主要是为了测试。
     */
    this.plugins = this.resolvePlugins();

    this.modes = this.plugins.reduce((modes, {
      apply: {
        defaultModes,
      },
    }) => Object.assign(modes, defaultModes), {});
  }

  /**
   * @example fuc-cli-service serve --open
   * command:'serve',
   * args:{_:['serve'],open:true}
   * rawArgv:['serve','--open']
   */
  async run(name, args = {}, rawArgv = []) {
    // resolve mode
    // prioritize inline --mode
    // 优先使用指定环境，否则使用插件注册时的指定环境
    const mode = args.mode || (name === 'build' && args.watch ? 'development' : this.modes[name]);

    // 加载Env变量，加载用户配置，应用插件
    this.init(mode);

    args._ = args._ || []; // eslint-disable-line no-param-reassign
    let command = this.commands[name];
    if (!command && name) {
      error(`command "${name}" does not exist.`);
      process.exit(1);
    }
    if (!command || args.help) {
      command = this.commands.help;
    } else {
      args._.shift(); // remove command itself
      rawArgv.shift();
    }
    const {
      fn,
    } = command;
    /**
     * command:'serve',
     * args:{_:['serve'],open:true}
     * rawArgv:['serve','--open']
     */
    return fn(args, rawArgv);
  }

  init(mode = process.env.VUE_CLI_MODE) {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.mode = mode;

    // load mode .env
    if (mode) {
      this.loadEnv(mode);
    }
    // load base .env
    this.loadEnv();

    // 读取 fuc.config.js 并 合并默认配置
    const userOptions = this.loadUserOptions();
    this.projectOptions = defaultsDeep(userOptions, defaults());

    debug('vue:project-config')(this.projectOptions);

    // apply plugins.
    this.plugins.forEach(({
      id,
      apply,
    }) => {
      apply(new PluginAPI(id, this), this.projectOptions);
    });

    // apply webpack configs from project config file
    if (this.projectOptions.chainWebpack) {
      this.webpackChainFns.push(this.projectOptions.chainWebpack);
    }
    if (this.projectOptions.configureWebpack) {
      this.webpackRawConfigFns.push(this.projectOptions.configureWebpack);
    }
  }

  /**
   * require插件并返回插件列表
   *
   * @returns
   */
  resolvePlugins() {
    /**
     * 导入内置插件和npm安装插件
     * @param {String} id
     */
    const idToPlugin = id => ({
      id: id.replace(/^.\//, 'built-in:'),
      apply: require(id), // eslint-disable-line global-require,import/no-dynamic-require
    });
    // TODO: 添加其他命令
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
      './config/babel',
      // './config/typescript',
      './config/eslint',
      './config/pwa',
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

    if (fileConfig) {
      resolved = fileConfig;
      resovledFrom = 'fuc.config.js';
    } else {
      resolved = {};
      resovledFrom = 'inline options';
    }

    // normalize some options
    ensureSlash(resolved, 'baseUrl');
    if (typeof resolved.baseUrl === 'string') {
      // 去掉./
      resolved.baseUrl = resolved.baseUrl.replace(/^\.\//, '');
    }
    removeSlash(resolved, 'outputDir');

    // TODO: 临时方案
    if (resolved.css && resolved.css.localIdentName) {
      warn('css.localIdentName has been deprecated. ' +
        'All css-loader options (except "modules") are now supported via css.loaderOptions.css.');
    }

    // validate options
    validate(resolved, (msg) => {
      error(`Invalid options in ${chalk.bold(resovledFrom)}: ${msg}`);
    });

    return resolved;
  }

  resolvePkg(context = this.context) {
    if (fs.existsSync(path.join(this.context, 'package.json'))) {
      return readPkg.sync({
        cwd: context,
      });
    }
    return {};
  }

  loadEnv(mode) {
    const logger = debug('vue:env');
    const basePath = path.resolve(this.context, `.env${mode ? `.${mode}` : ''}`);
    const localPath = `${basePath}.local`;

    const load = (filePath) => {
      try {
        const res = loadEnvConst(filePath);
        logger(filePath, res);
      } catch (err) {
        // only ignore error if file is not found
        if (err.toString().indexOf('ENOENT') < 0) {
          error(err);
        }
      }
    };

    load(localPath);
    load(basePath);

    if (mode) {
      // by default, NODE_ENV and BABEL_ENV are set to "development" unless mode
      // is production or test. However this can be overwritten in .env files.
      process.env.BABEL_ENV = mode === 'production' || mode === 'test' ? mode : 'development';
      process.env.NODE_ENV = process.env.BABEL_ENV;
    }
  }

  resolveChainableWebpackConfig() {
    const chainableConfig = new Config();
    // apply chains
    this.webpackChainFns.forEach(fn => fn(chainableConfig));
    return chainableConfig;
  }

  resolveWebpackConfig(chainableConfig = this.resolveChainableWebpackConfig()) {
    if (!this.initialized) {
      throw new Error('Service must call init() before calling resolveWebpackConfig().');
    }
    // get raw config
    let config = chainableConfig.toConfig();
    const original = config;
    // apply raw config fns
    this.webpackRawConfigFns.forEach((fn) => {
      if (typeof fn === 'function') {
        // function with optional return value
        const res = fn(config);
        if (res) config = merge(config, res);
      } else if (fn) {
        // merge literal values
        config = merge(config, fn);
      }
    });

    // #2206 If config is merged by merge-webpack, it discards the __ruleNames
    // information injected by webpack-chain. Restore the info so that
    // vue inspect works properly.
    if (config !== original) {
      cloneRuleNames(
        config.module && config.module.rules,
        original.module && original.module.rules,
      );
    }
    if (config.output.publicPath !== this.projectOptions.baseUrl) {
      throw new Error('Do not modify webpack output.publicPath directly. ' +
        'Use the "baseUrl" option in vue.config.js instead.');
    }
    return config;
  }
};
