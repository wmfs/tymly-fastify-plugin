const respond = require('../../../../util/respond')

module.exports = function describeExecution (request, reply) {
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

  request.log.debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.describeExecution(
    options.executionName,
    request.query.updateLastDescribed,
    {},
    (err, execDesc) => {
      if (err) request.log.debug(`Error: ${JSON.stringify(err)}`)
      if (execDesc) request.log.debug(`Execution description: ${JSON.stringify(execDesc)}`)

      respond(reply, err, execDesc, 200, 'Statebox returned an error while attempting to describe execution')
    }
  )
}
