const Chalk = require('chalk');

/* eslint-disable */
module.exports = function() {
  const Content =
    '\n' +
    Chalk.green(
      [
        ' _____   _   _   _____        _____   _       _ ',
        '|  ___| | | | | /  ___|      /  ___| | |     | |',
        '| |__   | | | | | |          | |     | |     | |',
        '|  __|  | | | | | |          | |     | |     | |',
        '| |     | |_| | | |___       | |___  | |___  | |',
        '|_|     \\_____/ \\_____|      \\_____| |_____| |_|',
      ].join('\n'),
    ) +
    `\n\n Version: ${require('../../package').version}\n\n`;

  process.stdout.write(Content);
};
