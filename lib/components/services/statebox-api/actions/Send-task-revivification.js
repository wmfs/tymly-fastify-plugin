module.exports = function sendTaskRevivification (statebox, request, reply, env) {
  const options = {}
  if (env.userId) options.userId = env.userId

  statebox.sendTaskRevivification(
    request.params.executionName,
    options
  )
    .then(() => reply.status(200).send())
    .catch(err => {
      console.error(err)
      reply.status(500).send()
    })
}
