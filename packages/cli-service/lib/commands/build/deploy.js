const Client = require('ftp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qiniu = require('qiniu');
// const {
//   log,
//   done,
//   info,
//   logWithSpinner,
//   stopSpinner,
// } = require('@fuc/cli-utils');


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
  const {
    deploy: deployConfig,
  } = options;

  /* eslint-disable consistent-return */
  function walk(dir, done) {
    fs.readdir(dir, (err, list) => {
      if (err) return done(err);

      list.forEach((file) => {
        // img图片不部署，使用七牛云单独存储
        if (path.basename(dir) === options.outputDir && file === 'img') return;

        file = path.resolve(dir, file);

        fs.stat(file, (eror, stats) => {
          if (eror) return done(err);

          const isFile = stats.isFile(); // 是文件
          const isDir = stats.isDirectory(); // 是文件夹

          if (isFile) {
            return done(null, file);
          }
          if (isDir) {
            walk(file, done); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
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
        console.log(`上传文件: ${chalk.cyan(deployConfig.ftpDomain + remotePath)}`);
        client.end();
      });
    });
  });


  client.connect({
    host: deployConfig.host,
    user: deployConfig.user,
    password: deployConfig.password,
  });

  const {
    accessKey,
    secretKey,
    bucket,
  } = deployConfig;
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);

  const qiniuOptions = {
    scope: bucket,
  };

  const putPolicy = new qiniu.rs.PutPolicy(qiniuOptions);
  const uploadToken = putPolicy.uploadToken(mac);
  const config = new qiniu.conf.Config();
  // 空间对应的机房
  config.zone = qiniu.zone.Zone_z0;

  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();
  // 文件上传

  walk(path.join(options.outputDir, 'img'), (err, localPath) => {
    if (err) throw err;

    formUploader.putFile(
      uploadToken, path.join(options.baseUrl, path.basename(localPath)).slice(1),
      localPath, putExtra, (
        respErr,
        respBody, respInfo,
      ) => {
        if (respErr) {
          throw respErr;
        }
        if (respInfo.statusCode === 200) {
          console.log(respBody);
          console.log(`上传文件: ${chalk.cyan(`https://img2.ultimavip.cn/${respBody.key}`)}`);
        } else {
          console.log(respInfo.statusCode);
          console.log(respBody);
        }
      },
    );
  });
};
