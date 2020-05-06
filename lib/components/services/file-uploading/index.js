const concat = require('concat-stream')

class FileUploadingService {
  boot (options, callback) {
    const { app } = options.bootedServices.server

    const router = async app => {
      const opts = { preValidation: [app.jwtCheck] }

      app.post('/', opts, (request, reply) => {
        if (!request.isMultipart()) {
          reply.code(400).send(new Error('Request is not multipart'))
          return
        }

        const mp = request.multipart(handler, onEnd)

        const body = {}

        mp.on('field', function (key, value) {
          body[key] = value
        })

        function onEnd(err) {
          if (err) {
            reply.code(400).send(err)
          } else {
            console.log('upload completed')
            reply.code(200).send()
          }
        }

        function handler (field, file, filename, encoding, mimetype) {
          console.log('')
          console.log('filename >>>', filename)
          console.log('body >>>', body)

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
      })
    }

    app.register(router, { prefix: '/upload' })

    callback(null)
  }
}

module.exports = {
  serviceClass: FileUploadingService,
  bootAfter: ['jwtAuth']
}
