module.exports = function sendTaskSuccess (statebox, request, reply, env) {
  const options = {}
  if (env.userId) options.userId = env.userId

  statebox.sendTaskSuccess(
    request.params.executionName,
    env.body.output || {},
    options,
    function (err) {
      if (err) {
        console.error(err)
        reply.status(500).send()
      } else {
        reply.status(200).send()
      }
    }
  )
}
