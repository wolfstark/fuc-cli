const ora = require('ora');
const chalk = require('chalk');

const spinner = ora();
let lastMsg = null;

exports.logWithSpinner = (symbol, msg) => {
  /* eslint-disable no-param-reassign */
  if (!msg) {
    msg = symbol;
    symbol = chalk.green('✔');
  }
  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text,
    });
  }
  spinner.text = ` ${msg}`;
  lastMsg = {
    symbol: `${symbol} `,
    text: msg,
  };
  spinner.start();
};

exports.stopSpinner = (persist) => {
  if (lastMsg && persist !== false) {
    // true 中断并结束上条状态
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text,
    });
  } else {
    // false 只中断
    spinner.stop();
  }
  lastMsg = null;
};

exports.pauseSpinner = () => {
  spinner.stop();
};

exports.resumeSpinner = () => {
  spinner.start();
};

// silent all logs except errors during tests and keep record
if (process.env.VUE_CLI_TEST) {
  require('./_silence')('spinner', exports);
}
