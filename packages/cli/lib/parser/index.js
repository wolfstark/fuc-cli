const Path = require('path');

/**
 * @desc 解析fuc配置文件
 * @param {string} env 环境变量
 * @param {Array} ignorePattern 忽略解析模块
 * @return {Promise}
 */
function parseConfiguration(env, ignorePattern) {
  return new Promise((resolve, reject) => {
    BoiParser(
      Path.join(process.cwd(), '/fuc-conf.js'),
      (err, configuration) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(configuration);
      },
      env,
      ignorePattern,
    );
  });
}
