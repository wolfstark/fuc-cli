#!/usr/bin/env node

const FeatureInfo = require('../lib/info');

// const Path = require("path");
const command = require('commander');
// const FeatureInfo = require('./features/info.js');
const FeatureGenerator = require('../lib/generator');
const log = require('../lib/log');
const cleanArgs = require('../lib/cleanArgs');
const Service = require('fuc-cli-service');

FeatureInfo();
command.version(require('../package').version).usage('<command> [options]');

command
  .command('new <app-name>')
  .description('generate a new app')
  .option('-t, --template [template]', 'specify template of new app', 'fucapp')
  .action((name, cmd) => {
    // console.log(cmd.template);
    FeatureGenerator(name, cleanArgs(cmd));
  })
  .on('--help', () => {
    log.info('\n\n  Examples:\n');
    log.info('\n\n  Examples:\n');
    log.info('    $ fuc new app');
    log.info('    $ fuc new app -t fucapp\n');
  });
// FeatureInfo();
// 开发服务器
command
  .command('serve')
  .description('run local server for development')
  .action(() => {
    process.env.FUC_ENV = 'dev';
    const service = Service(process.cwd());
    service.run('serve', { _: ['serve'], open: true }, ['serve', '--open']).catch((err) => {
      log.error(err);
      process.exit(1);
    });
    // ParseConfiguration('dev', ['deploy'])
    //   .then((configuration) => {
    //     BoiServer({
    //       compile: configuration.compile,
    //       deploy: configuration.deploy,
    //       serve: configuration.serve,
    //       plugins: configuration.plugins,
    //       mock: configuration.mock,
    //     });
    //   })
    //   .catch((err) => {
    //     throw new Error(err);
    //   });
  })
  .on('--help', () => {
    log.info('\n\n  Examples:\n');
    log.info('    $ boi serve\n');
  });
command.parse(process.argv);
