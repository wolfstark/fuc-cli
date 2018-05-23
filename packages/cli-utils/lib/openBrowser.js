/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 */

const opn = require('opn');
const execa = require('execa');
const chalk = require('chalk');
const {
  execSync,
} = require('child_process');

// https://github.com/sindresorhus/opn#app
const OSX_CHROME = 'google chrome';

const Actions = Object.freeze({
  NONE: 0,
  BROWSER: 1,
  SCRIPT: 2,
});

function getBrowserEnv() {
  // 试图兑现这个环境变量。
  // 它是特定于操作系统的。
  // See https://github.com/sindresorhus/opn#app for documentation.
  const value = process.env.BROWSER;
  let action;
  if (!value) {
    // Default.
    action = Actions.BROWSER;
  } else if (value.toLowerCase().endsWith('.js')) {
    action = Actions.SCRIPT;
  } else if (value.toLowerCase() === 'none') {
    action = Actions.NONE;
  } else {
    action = Actions.BROWSER;
  }
  return {
    action,
    value,
  };
}

function executeNodeScript(scriptPath, url) {
  const extraArgs = process.argv.slice(2);
  const child = execa('node', [scriptPath, ...extraArgs, url], {
    stdio: 'inherit',
  });
  child.on('close', (code) => {
    if (code !== 0) {
      console.log();
      console.log(chalk.red('The script specified as BROWSER environment variable failed.'));
      console.log(`${chalk.cyan(scriptPath)} exited with code ${code}.`);
      console.log();
    }
  });
  return true;
}

function startBrowserProcess(browser, url) {
  /**
   * 如果我们使用OS X，用户没有特别要求使用不同的浏览器，我们可以尝试使用AppleScript打开Chrome。
   * 这让我们在可能的情况下重用现有的选项卡，而不是创建新的选项卡。
   */
  const shouldTryOpenChromeWithAppleScript =
    process.platform === 'darwin' && (typeof browser !== 'string' || browser === OSX_CHROME);

  if (shouldTryOpenChromeWithAppleScript) {
    try {
      // 使用 AppleScript 尽可能重用OS X Google Chrome上的现有tabb
      execSync('ps cax | grep "Google Chrome"');
      execSync(`osascript openChrome.applescript "${encodeURI(url)}"`, {
        cwd: __dirname,
        stdio: 'ignore',
      });
      return true;
    } catch (err) {
      // Ignore errors.
    }
  }

  // Another special case: on OS X, check if BROWSER has been set to "open".
  // In this case, instead of passing `open` to `opn` (which won't work),
  // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
  // https://github.com/facebookincubator/create-react-app/pull/1690#issuecomment-283518768
  if (process.platform === 'darwin' && browser === 'open') {
    browser = undefined; // eslint-disable-line no-param-reassign
  }

  // Fallback to opn
  // (It will always open new tab)
  try {
    const options = {
      app: browser,
    };
    opn(url, options).catch(() => {}); // Prevent `unhandledRejection` error.
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 读取BROWSER环境变量并决定如何处理它。
 * 如果它打开浏览器或运行node.js脚本，则返回true，否则返回false。
 */
exports.openBrowser = (url) => {
  const {
    action,
    value,
  } = getBrowserEnv();
  switch (action) {
    case Actions.NONE:
      // 特殊情况：BROWSER =“none”将完全阻止打开。
      return false;
    case Actions.SCRIPT:
      return executeNodeScript(value, url);
    case Actions.BROWSER:
      return startBrowserProcess(value, url);
    default:
      throw new Error('Not implemented.');
  }
};