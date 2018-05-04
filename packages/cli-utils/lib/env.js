const { execSync } = require('child_process');

let _hasYarn;

// let _hasGit;

// env detection
exports.hasYarn = () => {
  if (_hasYarn != null) {
    return _hasYarn;
  }
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    // eslint-disable-next-line no-return-assign
    return (_hasYarn = true);
  } catch (e) {
    // eslint-disable-next-line no-return-assign
    return (_hasYarn = false);
  }
};
