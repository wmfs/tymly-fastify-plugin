const fastify = require('fastify')
const helmet = require('fastify-helmet')
const cors = require('fastify-cors')
const debug = require('debug')('tymly-fastify-plugin')
const addStaticDir = require('./add-static-dir')

class FastifyServerService {
  /**
   * Boot function to expose Server service class
   * @param {object} options
   * @param {function} callback Callback function for when boot is complete
   */
  async boot (options, callback) {
    const jsonLimit = process.env.TYMLY_REQUEST_SIZE_LIMIT || '10mb'

    const app = fastify()

    app.register(helmet)

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

    try {
      await addStaticDir(
        app,
        options.blueprintComponents,
        options.config,
        options.messages,
        options.bootedServices.temp.tempDir
      )

      this.fastify = fastify
      this.app = app

      callback(null)
    } catch (err) {
      callback(err)
    }
  }

  /**
   * Sets up a listener on a local Fastify app object
   * @param {String} port The port to listen on
   * @param {Function} callback
   * @example
   * server.listen(
   PORT,
   () => {
         console.log('\n')
         console.log(`Example app listening on port ${PORT}!\n`)
         done()
       }
   )
   */
  listen (port, callback) {
    this.app.listen(port, callback)
  }

  /**
   * Invokes shutdown function on this.app
   * @example
   * server.shutdown()
   */
  async shutdown () {
    debug('Shutting down...')
    try {
      await this.app.close()
      debug('Shut down successfully.')
    } catch (err) {
      console.log('Error shutting down', err)
    }
  }
}

module.exports = {
  serviceClass: FastifyServerService,
  bootAfter: ['temp'],
  schema: require('./schema.json')
}
