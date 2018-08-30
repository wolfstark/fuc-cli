const Client = require('ftp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');


function walk(dir, done) {
  const results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);

    let pending = list.length;

    if (!pending) return done(null, results);

    list.forEach((file) => {
      file = path.resolve(dir, file);
      results.push(file);
      pending -= 1;
      if (!pending) done(null, results);
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
 */
module.exports = function deploy(api, {
  baseUrl,
  deployConfig,
}) {
  const client = new Client();

  client.on('ready', () => {
    // client.list(function (err, list) {
    //     if (err) throw err;
    //     console.dir(list);
    //     client.end();
    // });

    const tpath = path.resolve(api.resolve('.'), 'dist');
    walk(tpath, (err, results) => {
      if (err) throw err;
      results.forEach((filename) => {
        const spath = baseUrl + path.basename(filename);
        client.put(filename, spath, (_err) => {
          if (_err) throw _err;
          console.dir(`上传文件: ${chalk.cyan(deployConfig.ftpDomain + spath)}`);
          client.end();
        });
      });
    });
  });


  client.connect({
    host: deployConfig.host,
    user: deployConfig.user,
    password: deployConfig.password,
  });
};
