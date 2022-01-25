const routes = require('./routes/index')

class StateboxApiService {
  boot (options) {
    const { app } = options.bootedServices.server

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', { ...opts, schema: routes.startExecution.schema }, routes.startExecution)
      app.get('/:executionName', { ...opts, schema: routes.describeExecution.schema }, routes.describeExecution)
      app.put('/:executionName', { ...opts, schema: routes.executionAction.schema }, routes.executionAction)
      app.delete('/:executionName', { ...opts, schema: routes.stopExecution.schema }, routes.stopExecution)
    }

    app.register(router, { prefix: '/executions' })
  }
}

module.exports = {
  serviceClass: StateboxApiService,
  bootAfter: ['jwtAuth', 'statebox']
}
