module.exports = function sendTaskHeartbeat (statebox, request, reply, env) {
  const options = {}
  if (env.userId) options.userId = env.userId

  statebox.sendTaskHeartbeat(
    request.params.executionName,
    env.body.output || {},
    options,
    function (err, executionDescription) {
      if (err) {
        console.error(err)
        reply.status(500).send()
      } else {
        reply.status(200).send(executionDescription)
      }
    }
  )
}
