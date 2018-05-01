const fs = require('fs');
const path = require('path');
const debug = require('debug');
const chalk = require('chalk');
const readPkg = require('read-pkg');
const merge = require('webpack-merge');
const Config = require('webpack-chain');
const loadEnvConst = require('./util/loadEnvConst');
const { error } = require('fuc-cli-utils');

module.exports = class Service {
  constructor(context, {
    plugins, pkg, projectOptions, useBuiltIn,
  } = {}) {
    process.FUC_CLI_SERVICE = this;
    this.context = context;
    this.webpackChainFns = [];
    this.webpackRawConfigFns = [];
    this.devServerConfigFns = [];
    this.commands = {};
    this.pkg = this.resolvePkg(pkg); //  没有则读取执行路径的package.json

    this.loadEnv();

    this.inlineOptions(projectOptions);
  }
  loadUserOptions(inlineOptions) {
    // fuc.config.js
    let fileConfig,
      pkgConfig,
      resolved,
      resovledFrom;
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
  }
  resolvePkg(inlinePkg) {
    if (inlinePkg) {
      return inlinePkg;
    } else if (fs.existsSync(path.join(this.context, 'package.json'))) {
      return readPkg.sync(this.context);
    }
    return {};
  }
  loadEnv(mode) {
    const logger = debug('fuc:env');
    const basePath = path.resolve(this.context, `.env${mode ? `${mode}` : ''}`);
    const localPath = `${basePath}.local`;

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
