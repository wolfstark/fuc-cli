/*
 * @Author: wangxiang
 * @Date: 2018-04-25 10:45:27
 * @Last Modified by: wangxiang
 * @Last Modified time: 2018-04-25 16:14:49
 */
/*
 * @Author: wangxiang
 * @Date: 2018-04-25 10:44:25
 * @Last Modified by:   wangxiang
 * @Last Modified time: 2018-04-25 10:44:25
 */

const _ = require('lodash');
const path = require('path');

const Shell = require('shelljs');
const log = require('./log');
const Yeoman = require('yeoman-environment');

// const env = Yeoman.createEnv();
// function createGenerators(env) {
//   const generators = Object.keys(env.getGeneratorsMeta()).reduce((namesByGenerator, generator) => {
//     const parts = generator.split(':');
//     const generatorName = parts.shift();

//     // 如果我们第一次发现这个生成器，准备保存所有的子生成器
//     if (!namesByGenerator[generatorName]) {
//       // eslint-disable-next-line  no-param-reassign
//       namesByGenerator[generatorName] = [];
//     }

//     // 如果子生成器 (!== app), 保存他
//     if (parts[0] !== 'app') {
//       namesByGenerator[generatorName].push(parts.join(':'));
//     }

//     return namesByGenerator;
//   }, {});

//   if (Object.keys(generators).length === 0) {
//     return "  Couldn't find any generators, did you install any? ";
//   }

//   return generators;
// }

module.exports = (dirname, options) => {
  const inCurrentDir = dirname === '.' || dirname === './';
  const appname = inCurrentDir ? path.relative('../', process.cwd()) : dirname;
  const GenerateTemplate = `generator-${options.template}`;

  const env = Yeoman.createEnv();

  // 查找环境中的每个命名空间，路径和查找
  env.lookup(() => {
    try {
      if (inCurrentDir) {
        env.run(`${options.template} ${appname} -c`);
      } else {
        env.run(`${options.template} ${appname}`);
      }
    } catch (e) {
      log.loading(
        new Promise((resolve, reject) => {
          Shell.exec(
            `npm install -g ${GenerateTemplate}`,
            {
              async: true,
              silent: true,
            },
            (_code) => {
              if (_code !== 0) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject(`Install ${GenerateTemplate} fails,please try install manually.`);
                return;
              }
              env.lookup(() => {
                if (!env.get(options.template)) {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  reject('Bad Generated name');
                  return;
                }
                if (inCurrentDir) {
                  env.run(`${options.template} ${appname} -c`);
                } else {
                  env.run(`${options.template} ${appname}`);
                }
                resolve({
                  msg: `Install ${GenerateTemplate} succeed`,
                });
              });
            },
          );
        }),
        `Installing ${GenerateTemplate}...`,
      );
    }
  });
  // if(generators)
  // const run
  // to compate nvm system
};
