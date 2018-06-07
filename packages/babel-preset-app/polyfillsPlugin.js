// 为入口文件注入polyfills.
module.exports = () => {
  let entryFile;
  return {
    name: 'fuc-cli-inject-polyfills',
    visitor: {
      Program(path, state) {
        // 默认第一个文件为入口文件，之后的文件不再注入
        // FIXME: 多页项目可能会出现问题
        if (!entryFile) {
          entryFile = state.filename;
        } else if (state.filename !== entryFile) {
          return;
        }

        const {
          polyfills,
        } = state.opts;
        const {
          createImport,
        } = require('@babel/preset-env/lib/utils');
        polyfills.forEach((p) => {
          // 注入polyfill
          createImport(path, p);
        });
      },
    },
  };
};
