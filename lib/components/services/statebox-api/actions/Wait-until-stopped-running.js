module.exports = function waitUntilStoppedRunning (statebox, request, reply, env) {
  const options = {}
  if (env.userId) options.userId = env.userId

  statebox.waitUntilStoppedRunning(
    request.params.executionName,
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
