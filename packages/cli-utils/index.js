['logger', 'pluginResolution', 'validate'].forEach((m) => {
  // eslint-disable-next-line
  Object.assign(exports, require(`./lib/${m}`));
});
