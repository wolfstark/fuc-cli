const Ora = require('ora');
const Chalk = require('chalk');

/**
 * @class synchronous loading class
 */
class Loading {
  /**
   * @param {string} text loading message
   */
  constructor(text) {
    this.spinner = new Ora(Chalk.green(text));
  }
  /**
   * @method start start the spinner
   */
  start() {
    this.spinner.start();
  }
  /**
   * @method success print success message and stop the spinner
   * @param {string} text success message
   */
  success(text) {
    this.spinner.succeed(Chalk.green(text));
  }
  /**
   * @method error print fail message and stop the spinner
   * @param {string} text error message
   */
  error(text) {
    this.spinner.fail(Chalk.red(text));
  }
}
/**
 * @module boi/util/log
 */
module.exports = {
  /**
   * @desc print success message
   * @param {string} text message text
   */
  success: (text) => {
    Ora().succeed(Chalk.green(text));
  },
  /**
   * @desc print error message
   * @param {string} text message text
   */
  error: (text) => {
    Ora().fail(Chalk.red(text));
  },
  /**
   * @desc print warning message
   * @param {string} text message text
   */
  warn: (text) => {
    Ora().warn(Chalk.yellow(text));
  },
  /**
   * @desc print info message
   * @param {string} text message text
   */
  info: (text) => {
    Ora().info(Chalk.gray(text));
  },
  /**
   * @desc print info message
   * @param {string} symbol custom symbol
   * @param {string} text message text
   */
  custom: ({ symbol, text }) => {
    Ora().stopAndPersist({
      symbol,
      text,
    });
  },
  /**
   * @desc start loading, stop and execute callbacks after promise fulfills
   * @param {Promise} action action promise
   * @param {string} text loading message
   * @param {Function} callback callback when promise has been resolved
   * @return {Promise}
   */
  loading: (action, text, callback) => {
    if (!action || typeof action.then !== 'function') {
      Ora().fail('Invalid parameter for util/log/loading');
    }
    const Spinner = Ora(Chalk.green(text)).start();
    return action
      .then(({ msg, data }) => {
        Spinner.succeed(Chalk.green(msg));
        if (typeof callback === 'function') callback(data);
      })
      .catch((msg) => {
        Spinner.fail(Chalk.red(msg));
      });
  },
  /**
   * @desc loading synchronously
   * @param {string} text loading message
   * @return {Object} a Ora instance that could be manipulated by referer
   */
  loadingSync: text => new Loading(text),
};
