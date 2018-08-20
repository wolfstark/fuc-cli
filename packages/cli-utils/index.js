['logger', 'pluginResolution', 'validate', 'spinner', 'ipc'].forEach((m) => {
  // eslint-disable-next-line
  Object.assign(exports, require(`./lib/${m}`));
});
exports.chalk = require('chalk')
exports.execa = require('execa')