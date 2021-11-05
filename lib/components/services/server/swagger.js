module.exports = {
  routePrefix: '/documentation',
  exposeRoute: true,
  staticCSP: true,
  swagger: {
    info: {
      title: 'Tymly API',
      description: 'Provides a CORS-enabled Fastify server'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here'
    },
    host: '0.0.0.0',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    },
    security: [
      {
        Bearer: []
      }
    ]
  }
}
