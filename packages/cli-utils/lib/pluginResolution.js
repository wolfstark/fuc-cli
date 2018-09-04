const pluginRE = /(^(@vue\/|vue-|@[\w-]+\/vue-)cli-plugin-)|(^built-in:config\/)/;
const scopeRE = /^@[\w-]+\//;

exports.isPlugin = id => pluginRE.test(id);

// 匹配id包含内置插件和外置插件
exports.matchesPluginId = (input, full) => {
  const short = full.replace(pluginRE, '');
  return (
  // input is full
    full === input ||
        // input is short without scope
        short === input ||
        // input is short with scope
        short === input.replace(scopeRE, '')
  );
};
