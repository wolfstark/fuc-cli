#!/usr/bin/env node

const FeatureInfo = require('./features/info');

// const Path = require("path");
const command = require('commander');
// const FeatureInfo = require('./features/info.js');
const FeatureGenerator = require('./features/generator.js');

function print(content) {
  process.stdout.write(content);
}
function cleanArgs(cmd) {
  const args = {};
  cmd.options.forEach((o) => {
    const key = o.long.replace(/^--/, '');
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function') {
      args[key] = cmd[key];
    }
  });
  return args;
}
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
    print('\n\n  Examples:\n');
    print('    $ fuc new app');
    print('    $ fuc new app -t fucapp\n');
  });
// FeatureInfo();

command.parse(process.argv);
