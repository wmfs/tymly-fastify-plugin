const fastify = require('fastify')
const helmet = require('fastify-helmet')
const cors = require('fastify-cors')
const multipart = require('fastify-multipart')

const addStaticDir = require('./add-static-dir')

class FastifyServerService {
  /**
   * Boot function to expose Server service class
   * @param {object} options
   * @param {function} callback Callback function for when boot is complete
   */
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:server')

    const jsonLimit = process.env.TYMLY_REQUEST_SIZE_LIMIT || '10mb'

    const app = fastify({
      logger: this.logger
    })

    app.register(helmet, {
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
    app.register(multipart)

    app.addContentTypeParser(
      'application/json',
      { parseAs: 'string', bodyLimit: jsonLimit },
      (req, body, done) => {
        try {
          const json = JSON.parse(body)
          done(null, json)
        } catch (err) {
          err.statusCode = 400
          done(err, undefined)
        }
      }
    )

    options.messages.info('Created Fastify app')
    options.messages.detail(`JSON Request Size - ${jsonLimit}`)

    // Make Tymly Control available to routes
    app.decorate('services', options.bootedServices)

    app.register(cors)
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
    this.app.listen(port, host, callback)
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
      this.logger.error(`Error shutting down: ${JSON.stringify(err)}`)
    }
  }
}

module.exports = {
  serviceClass: FastifyServerService,
  bootAfter: ['temp'],
  schema: require('./schema.json')
}
