const path = require('path')
const cpr = require('cpr')
const staticComponents = ['images']
const fastifyStatic = require('@fastify/static')

module.exports = async function (app, blueprintComponents, config, messages, tempDir) {
  const baseDir = config.staticRootDir || path.join(tempDir, 'tymly', 'static')

  messages.subHeading('Static root ' + JSON.stringify(baseDir))

  for (const staticComponent of staticComponents) {
    messages.info('Applying ' + staticComponent)

    const components = blueprintComponents[staticComponent]

    if (components) {
      for (const component of Object.values(components)) {
        const toPath = path.join(baseDir, staticComponent, component.namespace, component.filename)

        messages.detail(component.namespace + '\\' + component.filename)

        await cprPromise(component.filePath, toPath, { overwrite: true })
      }
    }
  }

  // todo: is this right?
  // app.use(express.static(baseDir))
  app.register(fastifyStatic, { root: baseDir })
}

function cprPromise (from, to, options = {}) {
  return new Promise((resolve, reject) => {
    cpr(from, to, options, (err, files) => {
      if (err) reject(err)
      else resolve(files)
    })
  })
}
