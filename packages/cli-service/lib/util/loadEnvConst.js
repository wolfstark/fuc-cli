const fs = require('fs');

function parse(src) {
  const res = {};
  src.split('\n').forEach((line) => {
    // eslint-disable-next-line no-useless-escape
    const keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);

    if (keyValueArr) {
      const key = keyValueArr[1];
      let value = keyValueArr[2] || '';

      // expand newlines in quoted values
      const len = value ? value.length : 0;
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n');
      }

      value = value.replace(/(^["']|["']$)/g, '').trim();
      res[key] = value;
    }
  });
  return res;
}
module.exports = function loadEnvConst(path = '.env') {
  const config = parse(fs.readFileSync(path, 'utf-8'));
  Object.keys(config).forEach((key) => {
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = config[key];
    }
  });
  return config;
};
