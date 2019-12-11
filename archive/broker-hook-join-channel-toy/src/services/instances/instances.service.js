// Initializes the `instances` service on path `/instances`
const { Instances } = require('./instances.class');
const hooks = require('./instances.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/instances', new Instances(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('instances');

  service.hooks(hooks);
};
