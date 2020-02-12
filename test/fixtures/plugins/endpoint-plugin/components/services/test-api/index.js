class TestApiEndPoint {
  boot (options, callback) {
    const { app } = options.bootedServices.server

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

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
