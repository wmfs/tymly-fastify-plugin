const path = require('path')
const { v1: uuid } = require('uuid')

const downloadPrefix = '/download'

class FileDownloadingService {
  async boot (options) {
    const { server } = options.bootedServices

    this.files = []

    const { app } = server
    const router = async app => {
      app.get('/:downloadKey', (request, reply) => this.serveFile(request, reply))
    }

    app.register(router, { prefix: downloadPrefix })
  } // boot

  addDownloadFile (localFilePath) {
    const fileUuid = uuid()
    this.files.push([fileUuid, localFilePath])

    return `${downloadPrefix}/${fileUuid}`
  } // addDownloadFile

  serveFile (request, reply) {
    const { downloadKey } = request.params
    const downloadPath = this.findFileToServe(downloadKey)

    reply.sendFile(
      path.basename(downloadPath),
      path.dirname(downloadPath)
    )
  } // serveFile

  findFileToServe (downloadKey) {
    const match = this.files
      .filter(([key]) => key === downloadKey)
    return match.length !== 0 ? match[0][1] : null
  } // findFileToServer
} // FileDownloadingService

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}
