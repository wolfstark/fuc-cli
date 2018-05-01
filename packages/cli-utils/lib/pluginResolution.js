const pluginRE = /^(@fuc\/|fuc-|@[\w-]+\/fuc-)cli-plugin-/;

exports.isPlugin = id => pluginRE.test(id);
