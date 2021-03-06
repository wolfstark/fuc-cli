const Client = require('ftp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qiniu = require('qiniu');
const { done } = require('@fuc/cli-utils');

/**
 * @typedef DeployConfig
 * @prop {string} host
 * @prop {string} user
 * @prop {string} password
 * @prop {string} ftpDomain
 * @prop {string} accessKey
 * @prop {string} secretKey
 * @prop {string} bucket
 */
/**
 *
 * @param {import("../../PluginAPI")} api
 * @param {{baseUrl:string,deploy:DeployConfig,outputDir:string}} options
 */
module.exports = function deploy(api, options) {
  const client = new Client();
  const { deploy: deployConfig } = options;

  /* eslint-disable consistent-return */
  function walk(dir, doneFn) {
    fs.readdir(dir, (err, list) => {
      if (err) return doneFn(err);

      list.forEach((file) => {
        // img图片不部署，使用七牛云单独存储
        if (path.basename(dir) === options.outputDir) return;

        file = path.resolve(dir, file);

        fs.stat(file, (eror, stats) => {
          if (eror) return doneFn(err);

          const isFile = stats.isFile(); // 是文件
          const isDir = stats.isDirectory(); // 是文件夹

          if (isFile) {
            return doneFn(null, file);
          }
          if (isDir) {
            walk(file, doneFn); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
          }
        });
      });
    });
  }

  client.on('ready', () => {
    // client.list(function (err, list) {
    //     if (err) throw err;
    //     console.dir(list);
    //     client.end();
    // });
    const outputDir = api.resolve(options.outputDir);
    walk(outputDir, (err, localPath) => {
      if (err) throw err;

      const remotePath = path.join(options.baseUrl, path.relative(outputDir, localPath));
      client.put(localPath, remotePath, (_err) => {
        if (_err) throw _err;
        if (remotePath.endsWith('.html')) {
          done(`部署完成: ${chalk.cyan(deployConfig.ftpDomain + remotePath)}`);
        }
        client.end();
      });
    });
  });

  client.connect({
    host: deployConfig.host,
    user: deployConfig.user,
    password: deployConfig.password,
  });
};
