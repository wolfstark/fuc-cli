const Client = require('ftp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/* eslint-disable consistent-return */
function walk(dir, done) {
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);

    list.forEach((file) => {
      file = path.resolve(dir, file);

      fs.stat(file, (eror, stats) => {
        if (eror) return done(err);

        const isFile = stats.isFile();// 是文件
        const isDir = stats.isDirectory();// 是文件夹

        if (isFile) {
          return done(file);
        }
        if (isDir) {
          walk(file);// 递归，如果是文件夹，就继续遍历该文件夹下面的文件
        }
      });
    });
  });
}
/**
 * @typedef DeployConfig
 * @prop {string} host
 * @prop {string} user
 * @prop {string} password
 * @prop {string} ftpDomain
 */
/**
 *
 * @param {import("../../PluginAPI")} api
 * @param {{baseUrl:string,deployConfig:DeployConfig}} options
 * @param {string} outputDir
 */
module.exports = function deploy(api, {
  baseUrl,
  deploy: deployConfig,
  outputDir,
}) {
  const client = new Client();

  client.on('ready', () => {
    // client.list(function (err, list) {
    //     if (err) throw err;
    //     console.dir(list);
    //     client.end();
    // });

    const targetDir = api.resolve(outputDir);
    walk(targetDir, (err, localPath) => {
      if (err) throw err;
      // results.forEach((localPath) => {
      const remotePath = baseUrl + path.basename(localPath);
      client.put(localPath, remotePath, (_err) => {
        if (_err) throw _err;
        console.dir(`上传文件:  ${chalk.cyan(deployConfig.ftpDomain + remotePath)}`);
        client.end();
      });
      // });
    });
  });


  client.connect({
    host: deployConfig.host,
    user: deployConfig.user,
    password: deployConfig.password,
  });
};
