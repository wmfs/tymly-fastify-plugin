const { cloneDeep } = require('lodash')
const boom = require('@hapi/boom')
const actions = require('../actions/index')
const schema = {
  ...require('./common-schema'),
  description: 'Perform an action on an existing Statebox execution',
  params: {
    type: 'object',
    properties: {
      executionName: {
        type: 'string',
        description: 'Execution name'
      }
    }
  },
  body: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform on Statebox execution',
        enum: [
          'SendTaskSuccess',
          'SendTaskHeartbeat',
          'SendTaskRevivification',
          'WaitUntilStoppedRunning'
        ]
      }
    }
  }
}

function executionAction (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const body = cloneDeep(request.body)

  const env = {
    services: this.services,
    authService: jwtAuthService,
    body,
    userId: jwtAuthService.extractUserIdFromRequest(request)
  }

  const { action } = env.body

  if (Object.prototype.hasOwnProperty.call(actions, action)) {
    actions[action](statebox, request, reply, env)
  } else {
    reply.status(404).send(
      boom.notFound(
        `Unknown execution action '${action}'`,
        { action }
      ).output.payload
    )
  }
}

module.exports = executionAction
module.exports.schema = schema
