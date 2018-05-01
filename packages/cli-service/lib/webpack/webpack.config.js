const Service = require('./Service');

const service = new Service(process.cwd());
module.exports = service.resolveWebpackConfig();
