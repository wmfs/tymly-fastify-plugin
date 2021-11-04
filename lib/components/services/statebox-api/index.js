const routes = require('./routes/index')
const swagger = require('./swagger')

class StateboxApiService {
  boot (options) {
    const { app } = options.bootedServices.server

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', { ...opts, schema: swagger.startExecution }, routes.startExecution)
      app.get('/:executionName', { ...opts, schema: swagger.describeExecution }, routes.describeExecution)
      app.put('/:executionName', { ...opts, schema: swagger.executionAction }, routes.executionAction)
      app.delete('/:executionName', { ...opts, schema: swagger.stopExecution }, routes.stopExecution)
    }

    app.register(router, { prefix: '/executions' })
  }
}

module.exports = {
  serviceClass: StateboxApiService,
  bootAfter: ['jwtAuth', 'statebox']
}
