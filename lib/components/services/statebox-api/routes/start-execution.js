const { cloneDeep } = require('lodash')
const boom = require('@hapi/boom')
const respond = require('../../../../util/respond')

// The only execution options an HTTP client may set. Everything else
// (userId, parentExecutionName, branchIndex, ...) is server-controlled.
const CLIENT_OPTIONS = ['sendResponse', 'instigatingClient']

module.exports = function startExecution (request, reply) {
  const jwtAuthService = this.services.jwtAuth
  const statebox = this.services.statebox

  const body = request.body || {}
  const stateMachineName = body.stateMachineName

  if (this.internalStateMachines && this.internalStateMachines.has(stateMachineName)) {
    const err = boom.forbidden(`State machine '${stateMachineName}' cannot be started directly`)
    return reply.status(err.output.statusCode).send(err.output.payload)
  }

  const input = cloneOrDefault(body.input)
  const options = pickClientOptions(body.options)

  options.action = 'startExecution'
  options.stateMachineName = stateMachineName

  const userId = jwtAuthService.extractUserIdFromRequest(request)
  if (userId) { options.userId = userId }

  request.log.debug(`Request to '${options.action}' on '${options.stateMachineName}' (by user '${options.userId}')`)

  statebox.startExecution(
    input,
    stateMachineName,
    options,
    (err, execDesc) => {
      if (err) request.log.debug(`Error: ${err.message}`)
      if (execDesc) request.log.debug(`Execution description: ${JSON.stringify(execDesc)}`)

      respond(reply, err, execDesc, 201, 'Statebox returned an error while attempting to start')
    }
  )
}

function cloneOrDefault (obj) {
  return obj ? cloneDeep(obj) : {}
}

function pickClientOptions (clientOptions) {
  const options = {}
  if (!clientOptions || typeof clientOptions !== 'object') return options

  for (const key of CLIENT_OPTIONS) {
    if (clientOptions[key] !== undefined) {
      options[key] = cloneDeep(clientOptions[key])
    }
  }
  return options
}
