const prefixRE = /^VUE_APP_/;

module.exports = function resolveClientEnv(options, raw) {
  const env = {};
  Object.keys(process.env).forEach((key) => {
    if (prefixRE.test(key) || key === 'NODE_ENV' || key === 'DEPLOY_ENV') {
      env[key] = process.env[key];
    }
  });
  env.BASE_URL = options.baseUrl;

  if (raw) {
    return env;
  }

  Object.keys(env).forEach((key) => {
    env[key] = JSON.stringify(env[key]);
  });
  return {
    'process.env': env,
  };
};
