const path = require('path')
const fs = require('fs')
const { v4: uuid } = require('uuid')
const { pipeline } = require('node:stream/promises')
const multipart = require('@fastify/multipart')

const DEFAULT_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024
const FORBIDDEN_FIELD_NAMES = ['upload', '__proto__', 'constructor', 'prototype']

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

    const serverFilename = path.join(this.uploadDir, uuid())
    let fileWritten = false

    try {
      const userId = this.jwtAuth.extractUserIdFromRequest(request)
      const body = {
        upload: {
          serverFilename
        }
      }

      const data = await request.file()
      if (!data) {
        return reply.code(400).send(new Error('No file in upload'))
      }

      fileWritten = true
      await pipeline(data.file, fs.createWriteStream(serverFilename))

      // @fastify/multipart ends the stream early (rather than erroring) when
      // the size limit is hit, so check explicitly or we'd keep a truncated file.
      if (data.file.truncated) {
        const err = new Error(`File exceeds the ${this.getFileSizeLimit()} byte upload limit`)
        err.statusCode = 413
        throw err
      }

      body.upload.clientFilename = data.filename
      body.upload.mimetype = data.mimetype

      // Note: only fields sent *before* the file part are available here.
      for (const field of Object.values(data.fields)) {
        if (Array.isArray(field) || field.type === 'file') continue
        if (FORBIDDEN_FIELD_NAMES.includes(field.fieldname)) continue
        body[field.fieldname] = field.value
      }

      if (!body.endpoint) {
        // Nothing will ever reference this file, so don't leave it on disk.
        await this.removeFile(serverFilename)
        return reply.code(200).send({})
      }

      const execDesc = await this.postUploadStateMachine(userId, body)

      if (execDesc.status === 'SUCCEEDED') {
        return reply.code(200).send({ ctx: execDesc.ctx })
      }

      this.logger.error(`Post Upload State Machine Failed: ${JSON.stringify(execDesc)}`)
      const status = execDesc.status === 'NOAUTH' ? 403 : 500
      return reply.code(status).send({
        status: execDesc.status,
        errorCode: execDesc.errorCode,
        errorMessage: execDesc.errorMessage
      })
    } catch (err) {
      if (fileWritten) await this.removeFile(serverFilename)
      this.logger.error(`Upload failed: ${err.message}`)
      const statusCode = err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 500
      return reply.code(statusCode).send(statusCode === 500 ? new Error('Upload failed') : err)
    }
  }

  postUploadStateMachine (userId, body) {
    return this.statebox.startExecution(
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
  }

  async removeFile (filename) {
    try {
      await fs.promises.unlink(filename)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.logger.error(`Failed to remove upload ${filename}: ${err.message}`)
      }
    }
  }

  getFileSizeLimit () {
    const raw = process.env.TYMLY_UPLOAD_FILE_SIZE_BYTES
    const fileSize = Number(raw)

    if (raw && Number.isFinite(fileSize) && fileSize > 0) {
      return fileSize
    }

    return DEFAULT_UPLOAD_FILE_SIZE_BYTES
  }
} // FileUploadService

module.exports = {
  serviceClass: FileUploadingService,
  bootAfter: ['jwtAuth', 'statebox']
}
