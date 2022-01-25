const respond = require('../../../../util/respond')
const debug = require('debug')('tymly-fastify-plugin')
const schema = {
  ...require('./common-schema'),
  description: 'Describe an existing Statebox execution',
  params: {
    type: 'object',
    properties: {
      executionName: {
        type: 'string',
        description: 'Execution name'
      }
    }
  }
}

function describeExecution (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const options = {
    executionName: request.params.executionName,
    action: 'describeExecution'
  }

  const userId = jwtAuthService.extractUserIdFromRequest(request)
  if (userId) {
    options.userId = userId
  }

  debug(`Request to '${options.action}' by user '${options.userId}' (executionName='${options.executionName}')`)

  statebox.describeExecution(
    options.executionName,
    {},
    (err, execDesc) => {
      if (err) debug('err:', err)
      if (execDesc) debug('execDesc:', execDesc)

      respond(reply, err, execDesc, 200, 'Statebox returned an error while attempting to describe execution')
    }
  )
}

module.exports = describeExecution
module.exports.schema = schema
