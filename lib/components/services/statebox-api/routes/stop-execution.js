const respond = require('../../../../util/respond')

module.exports = function cancelTymlyRoute (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const options = {
    userId: jwtAuthService.extractUserIdFromRequest(request),
    action: 'stopExecution',
    stateMachineName: request.params.executionName
  }

  request.log.debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.stopExecution(
    'Execution stopped externally',
    'STOPPED',
    request.params.executionName,
    options,
    (err, execDesc) => {
      if (err) request.log.debug(`Error: ${JSON.stringify(err)}`)
      if (execDesc) request.log.debug(`Execution description: ${JSON.stringify(execDesc)}`)

      respond(reply, err, execDesc, 204, `Execution returned an error while attempting to stop (executionName='${request.params.executionName})'`)
    }
  )
}
