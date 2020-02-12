class TestApiEndPoint {
  boot (options, callback) {
    const { app } = options.bootedServices.server

    // todo: const jwtCheck = options.bootedServices.jwtAuth.jwtCheck

    const router = async (app, opts) => {
      app.get('/', opts, getTestResponse)
    }

    app.register(router, { prefix: '/test-endpoint' })

    callback(null)
  }
}

function getTestResponse (request, reply) {
  const testResponse = {
    stateMachinesUserCanStart: [],
    forms: {}
  }

  reply.status(200).send(testResponse)
}

module.exports = {
  serviceClass: TestApiEndPoint,
  bootAfter: ['jwtAuth', 'server']
}
