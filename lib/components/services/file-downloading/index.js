const { v1: uuid } = require('uuid')

class FileDownloadingService {
  static prefix = '/download'

  async boot (options) {
    const { server } = options.bootedServices

    this.files = []

    const { app } = server
    const router = async app => {
      app.get('/:downloadKey', (request, reply) => this.serveFile(request, reply))
    }

    app.register(router, { prefix: FileDownloadingService.prefix })
  } // boot

  addDownloadFile(localFilePath) {
    const fileUuid = uuid()
    this.files.push([fileUuid, localFilePath])

    return `${FileDownloadingService.prefix}/${fileUuid}`
  } // addDownloadFile

  serveFile(request, reply) {
    reply.send({ hello: 'world' })
    console.log('Hello')
  } // serveFile
} // FileDownloadingService

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}

