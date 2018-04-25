const _ = require('lodash');
const path = require('path');

const Shell = require('shelljs');
const log = require('./log');
const Yeoman = require('yeoman-environment');

const YeomanRuntime = Yeoman.createEnv();


module.exports = (dirname, options) => {
  const inCurrentDir = dirname === '.' || dirname === './';
  const appname = inCurrentDir ? path.relative('../', process.cwd()) : dirname;
  // 不指定options.template使用默认的fucapp模板
  const GenerateTemplate = `generator-${options.template}`;
  // const run
  // to compate nvm system
  Shell.exec(
    'npm root -g', {
      async: true,
      silent: true,
    },
    (code, stdout) => {
      // global template path
      const TemplatePath = path.posix.join(_.trim(stdout), GenerateTemplate);

      try {
        const TemplateRealPath = require.resolve(TemplatePath);
        YeomanRuntime.register(TemplateRealPath, options.template);
        if (inCurrentDir) {
          YeomanRuntime.run(`${options.template} ${appname} -c`);
        } else {
          YeomanRuntime.run(`${options.template} ${appname}`);
        }
      } catch (e) {
        log.loading(
          new Promise((resolve, reject) => {
            Shell.exec(
              `npm install -g ${GenerateTemplate}`, {
                async: true,
                silent: true,
              },
              (_code) => {
                if (_code !== 0) {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  reject(`Install ${GenerateTemplate} fails,please try install manually.`);
                }
                YeomanRuntime.register(require.resolve(TemplatePath), options.template);

                if (inCurrentDir) {
                  YeomanRuntime.run(`${options.template} ${appname} -c`);
                } else {
                  YeomanRuntime.run(`${options.template} ${appname}`);
                }
                resolve({
                  msg: `Install ${GenerateTemplate} succeed`,
                });
              },
            );
          }),
          `Installing ${GenerateTemplate}...`,
        );
      }
    },
  );
};
