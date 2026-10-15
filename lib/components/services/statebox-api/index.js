const routes = require('./routes/index')

// State machines that must only ever be started by other state machines
// (e.g. via module:runStateMachine), never directly over HTTP.
// tymly_downloadFile_1_0 serves whatever local path it is given, so letting a
// client start it directly would allow any authenticated user to read (and
// delete) arbitrary files on the server.
const DEFAULT_INTERNAL_STATE_MACHINES = ['tymly_downloadFile_1_0']

class StateboxApiService {
  boot (options) {
    const { app } = options.bootedServices.server

    const configured = (options.config && options.config.internalStateMachines) || []
    const internalStateMachines = new Set([...DEFAULT_INTERNAL_STATE_MACHINES, ...configured])

    const router = async app => {
      app.decorate('internalStateMachines', internalStateMachines)

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
  bootAfter: ['jwtAuth', 'statebox'],
  DEFAULT_INTERNAL_STATE_MACHINES
}
