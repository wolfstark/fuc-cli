#!/usr/bin/env node

const semver = require('semver');
const {
  error,
} = require('fuc-cli-utils');
const requiredVersion = require('../package.json').engines.node;


if (!semver.satisfies(process.version, requiredVersion)) {
  error(`当前Node版本 ${process.version},  fuc-cli-service ` +
    `依赖 Node ${requiredVersion}.\n请升级 NodeJS.`);
  process.exit(1);
}

const Service = require('../lib/Service');

const service = new Service(process.cwd());

const rawArgv = process.argv.slice(2);
const args = require('minimist')(rawArgv);

const command = args._[0];
/**
 * command:'serve',
 * args:{_:['serve'],open:true}
 * rawArgv:['serve','--open']
 */
service.run(command, args, rawArgv).catch((err) => {
  error(err);
  process.exit(1);
});
