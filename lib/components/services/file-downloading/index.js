const path = require('path')
const fsp = require('fs').promises
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
    app.addHook('onResponse', (request, reply) => this.fileCleanUp(request, reply))
  } // boot

  addDownloadFile (localFilePath, deleteAfterDownload = true) {
    const fileUuid = uuid()
    this.files.push([fileUuid, localFilePath, deleteAfterDownload])

    return `${downloadPrefix}/${fileUuid}`
  } // addDownloadFile

  serveFile (request, reply) {
    const { downloadKey } = request.params
    const match = this.findFile(downloadKey)

    if (!match) {
      return reply.code(404).type('text/html').send('Not Found')
    }

    const downloadPath = match[1]
    reply.sendFile(
      path.basename(downloadPath),
      path.dirname(downloadPath)
    )
  } // serveFile

  fileCleanUp (request, reply) {
    if (!request.params) return
    const { downloadKey } = request.params
    if (!downloadKey) return

    const match = this.findFile(downloadKey)
    if (!match) return

    if (match[2])
      fsp.unlink(match[1])
  } // fileCleanUp

  findFile (downloadKey) {
    const match = this.files
      .filter(([key]) => key === downloadKey)
    return match.length !== 0 ? match[0] : null
  } // findFileToServer
} // FileDownloadingService

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}
