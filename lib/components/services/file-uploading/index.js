const path = require('path')
const fs = require('fs')
const { v1: uuid } = require('uuid')

class FileUploadingService {
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:fileUploading')

    const { server, temp, jwtAuth, statebox } = options.bootedServices
    this.uploadDir = await temp.makeTempDir('upload')
    this.jwtAuth = jwtAuth
    this.statebox = statebox

    const { app } = server
    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', opts, (request, reply) => this.upload(request, reply))
    }

    app.register(router, { prefix: '/upload' })
  }

  upload (request, reply) {
    if (!request.isMultipart()) {
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }

    const userId = this.jwtAuth.extractUserIdFromRequest(request)
    const body = {}

    const mp = request.multipart(
      (field, file, filename, encoding, mimetype) => this.handler(field, file, filename, encoding, mimetype, body),
      err => this.onEnd(err, reply, userId, body)
    )
    mp.on('field', function (key, value) {
      body[key] = value
    })
  }

  handler (field, file, filename, encoding, mimetype, body) {
    const serverFilename = path.join(this.uploadDir, uuid())
    file.pipe(fs.createWriteStream(serverFilename))

    body.upload = {
      serverFilename,
      clientFilename: filename,
      mimetype
    }
  }

  async onEnd (err, reply, userId, body) {
    if (err) {
      return reply.code(400).send(err)
    }

    try {
      const result = await this.postUploadStateMachine(userId, body)
      reply.code(200).send(result)
    } catch (err) {
      reply.code(500).send(err)
    }
  } // onEnd

  async postUploadStateMachine (userId, body) {
    if (!body.endpoint) return { }

    const execDesc = await this.statebox.startExecution(
      {
        body
      },
      body.endpoint,
      {
        sendResponse: 'COMPLETE',
        stateMachineName: body.endpoint,
        userId
      }
    )

    if (execDesc.status === 'SUCCEEDED') {
      return { ctx: execDesc.ctx }
    } else {
      this.logger.error(`Post Upload State Machine Failed: ${JSON.stringify(execDesc)}`)
    }
  }
} // FileUploadService

module.exports = {
  serviceClass: FileUploadingService,
  bootAfter: ['jwtAuth', 'statebox']
}
