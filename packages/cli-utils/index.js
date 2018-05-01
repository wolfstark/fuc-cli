['logger', 'pluginResolution'].forEach((m) => {
  // eslint-disable-next-line
  Object.assign(exports, require(`./lib/${m}`));
});
