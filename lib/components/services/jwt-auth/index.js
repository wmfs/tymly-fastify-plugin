const boom = require('@hapi/boom')
const dottie = require('dottie')
const Buffer = require('safe-buffer').Buffer
const jwt = require('jsonwebtoken')
const fastifyJwt = require('@fastify/jwt')
const fs = require('fs')
const axios = require('axios')

class AuthService {
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:jwtAuth')

    const secret = await findSecret(options)
    const audience = findAudience(options)

    if (audience && secret) {
      const app = options.bootedServices.server.app

      app.register(fastifyJwt, {
        secret: {
          public: secret
        },
        verify: {
          allowedAud: audience
        }
      })

      app.decorate('jwtCheck', async (request, reply) => {
        try {
          await request.jwtVerify()
        } catch (err) {
          reply.send(err)
        }
      })

      this.secret = secret
      this.audience = audience
      this.findCertificate = findCertificate

      options.messages.info('Added JWT Fastify middleware')
    } else {
      this.logger.error('Failed to set-up authentication middleware: Is $TYMLY_AUTH_SECRET/$TYMLY_AUTH_CERTIFICATE and $TYMLY_AUTH_AUDIENCE set?')
      throw boom.internal('Failed to set-up authentication middleware: Is $TYMLY_AUTH_SECRET/$TYMLY_AUTH_CERTIFICATE and $TYMLY_AUTH_AUDIENCE set?')
    }
  } // boot

  /**
   * Generates a JWT for use in Tymly auth stuff
   * @param {Object} subject The subject to be supplied to the JWT
   * @returns {String} The JWT produced by the jwt.sign function
   * @example
   * const jwt = generateToken(subject)
   */
  generateToken (subject) {
    return jwt.sign(
      {},
      this.secret,
      {
        subject,
        audience: this.audience
      }
    )
  } // generateToken

  /**
   * Extracts a userID from an fastify request object
   * @param {Object} req A fastify request object
   * @returns {String} A userId extracted from the request (derived via the `user` property added via [fastify-jwt](https://www.npmjs.com/package/fastify-jwt) middleware)
   * @example
   * var userId = auth.extractUserIdFromRequest (req)
   * console.log(userId) // myUsername@tymlyjs.io
   */
  extractUserIdFromRequest (req) {
    let userId
    if (Object.prototype.hasOwnProperty.call(req, 'user')) {
      userId = req.user.sub
    }
    return userId
  } // extractUserIdFromRequest
} // AuthService

/**
 * Extracts a secret from a supplied 'options' object
 * @param {Object} options Object to search for secret within
 * @returns {String} The secret extracted from the 'options' object
 * @example
 * const secret = findSecret(options)
 */
async function findSecret (options) {
  const secret = await findCertificate(options) || findAuthSecret(options)

  if (secret === undefined) {
    options.messages.error(
      {
        name: 'noSecret',
        message: 'No authentication secret was supplied via config or the $TYMLY_AUTH_SECRET environment variable'
      }
    )
  }

  return secret
} // findSecret

/**
 * Extracts a certificate from a supplied 'options' object, or failing that takes it from 'TYMLY_CERTIFICATE_PATH' environment variable
 * @param {Object} options Object to search for secret within
 * @returns {String} The certificate extracted from the 'options' object, or grabbed from the env var
 * @example
 * const cert = findCertificate(options)
 */
async function findCertificate (options) {
  // TODO: This should be coming from options, not directly from an env variable.
  const certPath = dottie.get(options, 'config.auth.certificate') || process.env.TYMLY_CERTIFICATE_PATH
  if (certPath) {
    options.messages.info(`Loading certificate from ${certPath}`)
    return fs.readFileSync(certPath)
  } else if (process.env.AUTH0_DOMAIN) {
    const pemUrl = `https://${process.env.AUTH0_DOMAIN}.eu.auth0.com/pem`

    const { data } = await axios.get(pemUrl)
    return data
  } else {
    return undefined
  }
} // findCertificate

/**
 * Extracts an authentication secret from a supplied 'options' object, or failing that takes it from 'TYMLY_AUTH_SECRET' environment variable
 * @param {Object} options Object to search for secret within
 * @returns {String} The secret extracted from the 'options' object, or grabbed from the env var
 * @example
 * const secret = findAuthSecret(options)
 */
function findAuthSecret (options) {
  const secret = dottie.get(options, 'config.auth.secret') || process.env.TYMLY_AUTH_SECRET
  if (secret) {
    options.messages.info('Using auth secret')
  }

  return secret ? Buffer.from(secret, 'base64') : undefined
} // findAuthSecret

/**
 * Extracts an audience from a supplied 'options' object, or failing that takes it from 'TYMLY_AUTH_AUDIENCE' environment variable
 * @param {Object} options Object to search for secret within
 * @returns {String} The certificate extracted from the 'options' object, or grabbed from the env var
 * @example
 * const audience = findAudience(options)
 */
function findAudience (options) {
  const audience = dottie.get(options, 'config.auth.audience') || process.env.TYMLY_AUTH_AUDIENCE

  if (audience === undefined) {
    options.messages.error(
      {
        name: 'noAudience',
        message: 'No authentication audience was supplied via config or the $TYMLY_AUTH_AUDIENCE environment variable'
      }
    )
  } else {
    options.messages.info(`Audience ${audience}`)
  }

  return audience
} // findAudience

module.exports = {
  serviceClass: AuthService,
  bootAfter: ['server'],
  schema: require('./schema.json')
}
