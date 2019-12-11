const resources = require('./resources/resources.service.js');
const instances = require('./instances/instances.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(resources);
  app.configure(instances);
};
