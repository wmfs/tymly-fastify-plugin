module.exports = {
  routePrefix: '/documentation',
  exposeRoute: true,
  // staticCSP: true,
  swagger: {
    info: {
      title: 'Tymly API',
      description: 'Provides a CORS-enabled Fastify server'
    },
    // host: '0.0.0.0',
    // schemes: ['http', 'https'],
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
    /*
    security: [{ bearerAuth: [] }],
    securityDefinitions: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
    */
  }
}
