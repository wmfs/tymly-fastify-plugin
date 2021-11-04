module.exports = {
  routePrefix: '/documentation',
  exposeRoute: true,
  // staticCSP: true,
  swagger: {
    info: {
      title: 'Tymly API',
      description: 'Provides a CORS-enabled Fastify server'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here'
    },
    // host: 'localhost',
    schemes: ['https'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
}
