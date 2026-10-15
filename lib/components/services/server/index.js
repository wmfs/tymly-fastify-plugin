const fastify = require('fastify')
const helmet = require('@fastify/helmet')
const cors = require('@fastify/cors')

const addStaticDir = require('./add-static-dir')
const parseSize = require('../../../util/parse-size')

const DEFAULT_BODY_LIMIT_BYTES = 10 * 1024 * 1024

class FastifyServerService {
  /**
   * Boot function to expose Server service class
   * @param {object} options
   * @param {function} callback Callback function for when boot is complete
   */
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:server')

    const bodyLimit = parseSize(process.env.TYMLY_REQUEST_SIZE_LIMIT, DEFAULT_BODY_LIMIT_BYTES)

    // Use Fastify's built-in JSON parser - it enforces bodyLimit and
    // rejects __proto__/constructor.prototype keys (prototype poisoning).
    const app = fastify({
      loggerInstance: this.logger,
      bodyLimit
    })

    app.register(helmet, {
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })

    options.messages.info('Created Fastify app')
    options.messages.detail(`Request body limit - ${bodyLimit} bytes`)

    // Make Tymly Control available to routes
    app.decorate('services', options.bootedServices)

    app.register(cors, { methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' })
    options.messages.info('Configured CORS')

    await addStaticDir(
      app,
      options.blueprintComponents,
      options.config,
      options.messages,
      options.bootedServices.temp.tempDir
    )

    this.fastify = fastify
    this.app = app
  }

  /**
   * Sets up a listener on a local Fastify app object
   * @param {String} port The port to listen on
   * @param {String} host
   * @param {Function} callback
   * @example
   * server.listen(
   PORT,
   HOST,
   () => {
         console.log('\n')
         console.log(`Example app listening on port ${PORT}!\n`)
         done()
       }
   )
   */
  listen (port, host, callback) {
    this.app.listen({ port, host }, callback)
  }

  /**
   * Invokes shutdown function on this.app
   * @example
   * server.shutdown()
   */
  async shutdown () {
    this.logger.debug('Shutting down...')
    try {
      await this.app.close()
      this.logger.debug('Shut down successfully')
    } catch (err) {
      this.logger.error(`Error shutting down: ${err && err.message}`)
    }
  }
}

module.exports = {
  serviceClass: FastifyServerService,
  bootAfter: ['temp'],
  schema: require('./schema.json')
}
