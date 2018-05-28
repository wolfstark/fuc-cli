const joi = require('joi');

/**
 * proxy to joi for option validation
 *
 * @param {any} fn
 */
exports.createSchema = function createSchema(fn) {
  return fn(joi);
};

exports.validate = (obj, schema, cb) => {
  joi.validate(obj, schema, {}, (err) => {
    if (err) {
      cb(err.message);
      process.exit(1);
    }
  });
};