const { cloneDeep } = require('lodash')
const boom = require('boom')
const actions = require('../actions/index')

module.exports = function (request, reply) {
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
