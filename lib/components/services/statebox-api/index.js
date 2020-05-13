const routes = require('./routes/index')

class StateboxApiService {
  boot (options) {
    const { app } = options.bootedServices.server

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', opts, routes.startExecution)
      app.get('/:executionName', opts, routes.describeExecution)
      app.put('/:executionName', opts, routes.executionAction)
      app.delete('/:executionName', opts, routes.stopExecution)
    }

    app.register(router, { prefix: '/executions' })
  }
}

module.exports = {
  serviceClass: StateboxApiService,
  bootAfter: ['jwtAuth', 'statebox']
}
