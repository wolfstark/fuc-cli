const Client = require('ftp');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const qiniu = require('qiniu');
const {
  done,
} = require('@fuc/cli-utils');


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
  function walk(dir, doneFn) {
    fs.readdir(dir, (err, list) => {
      if (err) return doneFn(err);

      list.forEach((file) => {
        // img图片不部署，使用七牛云单独存储
        if (path.basename(dir) === options.outputDir && file === 'img') return;

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

  const accessKey = 'zWHToHUzjBG6azWpQ-8ne6Y487ovItQcAQE0mMSx';
  const secretKey = 'OZ4hf7TQT_Cfq6mcZIC4HWGQO1wUwalY-xJd6NNk';

  const {
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
          // console.log(`上传文件: ${chalk.cyan(`https://img2.ultimavip.cn/${respBody.key}`)}`);
        } else {
          console.log(respInfo.statusCode);
          console.log(respBody);
        }
      },
    );
  });
};
