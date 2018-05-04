const chalk = require('chalk');
// const readline = require('readline');
const padStart = require('string.prototype.padstart');

const chalkTag = msg => chalk.bgBlackBright.white.dim(` ${msg} `);

const format = (label, msg) =>
  msg
    .split('\n')
    .map((line, i) => (i === 0 ? `${label} ${line}` : padStart(line, chalk.reset(label).length)))
    .join('\n');

exports.info = (msg, tag = null) => {
  console.log(format(chalk.bgBlue.black(' INFO ') + (tag ? chalkTag(tag) : ''), msg));
};

exports.warn = (msg, tag = null) => {
  console.warn(format(chalk.bgYellow.black(' WARN ') + (tag ? chalkTag(tag) : ''), chalk.yellow(msg)));
};

exports.error = (msg, tag = null) => {
  console.error(format(chalk.bgRed(' ERROR ') + (tag ? chalkTag(tag) : ''), chalk.red(msg)));
  if (msg instanceof Error) {
    console.error(msg.stack);
  }
};
