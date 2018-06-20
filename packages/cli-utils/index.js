['logger', 'pluginResolution', 'validate', 'spinner'].forEach((m) => {
  // eslint-disable-next-line
  Object.assign(exports, require(`./lib/${m}`));
});
