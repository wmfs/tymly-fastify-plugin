const { cloneDeep } = require('lodash')
const respond = require('../../../../util/respond')
const debug = require('debug')('tymly-fastify-plugin')
const cloneOrDefault = obj => obj ? cloneDeep(obj) : {}
const schema = {
  ...require('./common-schema'),
  description: 'Start a new Statebox execution',
  body: {
    type: 'object',
    properties: {
      stateMachineName: {
        type: 'string'
      },
      input: {
        type: 'object'
      },
      options: {
        type: 'object',
        properties: {
          instigatingClient: {
            type: 'object',
            properties: {
              appName: {
                type: 'string'
              },
              domain: {
                type: 'string'
              }
            }
          },
          sendResponse: {
            type: 'string'
          }
        }
      }
    }
  }
}

function startExecution (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const stateMachineName = request.body.stateMachineName
  const input = cloneOrDefault(request.body.input)
  const options = cloneOrDefault(request.body.options)

  options.action = 'startExecution'
  options.stateMachineName = stateMachineName

  const userId = jwtAuthService.extractUserIdFromRequest(request)
  if (userId) { options.userId = userId }

  statebox.startExecution(
    input,
    stateMachineName,
    options,
    (err, execDesc) => {
      if (err) debug('err:', err)
      if (execDesc) debug('execDesc:', execDesc)

      respond(reply, err, execDesc, 201, 'Statebox returned an error while attempting to start')
    }
  )
}

module.exports = startExecution
module.exports.schema = schema
