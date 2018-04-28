#!/usr/bin/env node

const FeatureInfo = require('../lib/info');

// const Path = require("path");
const command = require('commander');
// const FeatureInfo = require('./features/info.js');
const FeatureGenerator = require('../lib/generator');
const log = require('../lib/log');
const cleanArgs = require('../lib/cleanArgs');

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
  .option('-i, --init', 'init all configurations and install plugins&dependencies')
  .option('-s, --separate', 'run server without mock')
  .action((options) => {
    process.env.BOI_ENV = 'dev';
    if (options.separate) {
      ParseConfiguration('dev', ['mock', 'deploy'])
        .then((configuration) => {
          BoiServer(
            {
              compile: configuration.compile,
              deploy: configuration.deploy,
              plugins: configuration.plugins,
              serve: configuration.serve,
            },
            options.init,
          );
        })
        .catch((err) => {
          throw new Error(err);
        });
    } else {
      ParseConfiguration('dev', ['deploy'])
        .then((configuration) => {
          BoiServer(
            {
              compile: configuration.compile,
              deploy: configuration.deploy,
              serve: configuration.serve,
              plugins: configuration.plugins,
              mock: configuration.mock,
            },
            options.init,
          );
        })
        .catch((err) => {
          throw new Error(err);
        });
    }
  })
  .on('--help', () => {
    log.info('\n\n  Examples:\n');
    log.info('    $ boi serve\n');
  });
command.parse(process.argv);
