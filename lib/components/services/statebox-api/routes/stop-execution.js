const respond = require('../../../../util/respond')
const debug = require('debug')('tymly-fastify-plugin')
const schema = {
  ...require('./common-schema'),
  description: 'Stop an existing Statebox execution',
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

function stopExecution (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const options = {
    userId: jwtAuthService.extractUserIdFromRequest(request),
    action: 'stopExecution',
    stateMachineName: request.params.executionName
  }

  debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.stopExecution(
    'Execution stopped externally',
    'STOPPED',
    request.params.executionName,
    options,
    (err, execDesc) => {
      if (err) debug('err:', err)
      if (execDesc) debug('execDesc:', execDesc)

      respond(reply, err, execDesc, 204, `Execution returned an error while attempting to stop (executionName='${request.params.executionName})'`)
    }
  )
}

module.exports = stopExecution
module.exports.schema = schema
