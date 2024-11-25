const path = require('path')
const fs = require('fs')
const { v1: uuid } = require('uuid')
const { pipeline } = require('node:stream/promises')
const multipart = require('@fastify/multipart')

const DEFAULT_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024

class FileUploadingService {
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:fileUploading')

    const { server, temp, jwtAuth, statebox } = options.bootedServices
    this.uploadDir = await temp.makeTempDir('upload')
    this.jwtAuth = jwtAuth
    this.statebox = statebox

    const { app } = server

    app.register(
      multipart,
      {
        limits: {
          fileSize: this.getFileSizeLimit()
        }
      }
    )

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', opts, (request, reply) => this.upload(request, reply))
    }

    app.register(router, { prefix: '/upload' })
  }

  async upload (request, reply) {
    if (!request.isMultipart()) {
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }

    try {
      const userId = this.jwtAuth.extractUserIdFromRequest(request)
      const serverFilename = path.join(this.uploadDir, uuid())
      const body = {
        upload: {
          serverFilename
        }
      }

      const data = await request.file()

      const ws = fs.createWriteStream(serverFilename)
      await pipeline(data.file, ws)

      body.upload.clientFilename = data.filename
      body.upload.mimetype = data.mimetype

      Object.values(data.fields).forEach(field => {
        if (field.fieldname !== 'upload') {
          body[field.fieldname] = field.value
        }
      })

      const result = await this.postUploadStateMachine(userId, body)
      return reply.code(200).send(result)
    } catch (err) {
      return reply.code(500).send(err)
    }
  }

  async postUploadStateMachine (userId, body) {
    if (!body.endpoint) return {}

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

  getFileSizeLimit () {
    const fileSize = Number(process.env.TYMLY_UPLOAD_FILE_SIZE_BYTES)

    if (!isNaN(fileSize)) {
      return fileSize
    }

    return DEFAULT_UPLOAD_FILE_SIZE_BYTES
  }
} // FileUploadService

module.exports = {
  serviceClass: FileUploadingService,
  bootAfter: ['jwtAuth', 'statebox']
}
