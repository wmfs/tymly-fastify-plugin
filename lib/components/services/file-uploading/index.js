const concat = require('concat-stream')

class FileUploadingService {
  async boot(options) {
    const { server, temp, jwtAuth, statebox } = options.bootedServices
    this.uploadDir = await temp.makeTempDir('upload')
    this.jwtAuth = jwtAuth
    this.statebox = statebox

    const { app } = server
    const router = async app => {
      const opts = {preValidation: [app.jwtCheck]}

      app.post('/', opts, (request, reply) => this.upload(request, reply))
    }

    app.register(router, {prefix: '/upload'})
  }

  upload (request, reply) {
    if (!request.isMultipart()) {
      reply.code(400).send(new Error('Request is not multipart'))
      return
    }

    const userId = this.jwtAuth.extractUserIdFromRequest(request)
    const body = {}

    const mp = request.multipart(
      handler,
      err => this.onEnd(err, reply, userId, body)
    )
    mp.on('field', function (key, value) {
      body[key] = value
    })
  }

  async onEnd (err, reply, userId, body) {
    console.log('upload completed', err)
    if (err) {
      return reply.code(400).send(err)
    }

    try {
      const result = await this.postUploadStateMachine(userId, body)
      console.log(JSON.stringify(result))
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
        userId
      }
    )

    if (execDesc.status === 'SUCCEEDED') {
      return { ctx: execDesc.ctx }
    }
  }
} // FileUploadService

function handler (field, file, filename, encoding, mimetype) {
    // to accumulate the file in memory! Be careful!
    //
    file.pipe(concat(function (buf) {
      console.log('received', filename, 'size', buf.length)
    }))
    //
    // or

    // pump(file, fs.createWriteStream('a-destination'))

    // be careful of permission issues on disk and not overwrite
    // sensitive files that could cause security risks

    // also, consider that if the file stream is not consumed, the
    // onEnd callback won't be called
}

module.exports = {
  serviceClass: FileUploadingService,
  bootAfter: ['jwtAuth', 'statebox']
}
