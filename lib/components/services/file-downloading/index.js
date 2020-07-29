const path = require('path')
const fsp = require('fs').promises
const { v1: uuid } = require('uuid')

const downloadPrefix = '/download'
const prefixPattern = new RegExp(downloadPrefix)

class FileDownloadingService {
  async boot (options) {
    const { server } = options.bootedServices

    this.files = new Map()

    const { app } = server
    const router = async app => {
      app.get('/:downloadKey', (request, reply) => this.serveFile(request, reply))
    }

    app.register(router, { prefix: downloadPrefix })
    app.addHook('onResponse', (request, reply) => this.fileCleanUp(request, reply))
  } // boot

  addDownloadFile (
    localFilePath,
    deleteAfterDownload = true,
    downloadName = null
  ) {
    const fileUuid = uuid()
    this.files.set(fileUuid, {
      path: localFilePath,
      delete: deleteAfterDownload,
      name: downloadName
    })
    return `${downloadPrefix}/${fileUuid}`
  } // addDownloadFile

  serveFile (request, reply) {
    const { downloadKey } = request.params
    const match = this.files.get(downloadKey)

    if (!match) {
      return reply.code(404).type('text/html').send('Not Found')
    }

    if (match.name) {
      reply.header(
        'Content-Disposition',
        `attachment; filename="${match.name}"`
      )
    }

    const downloadPath = match.path
    reply.sendFile(
      path.basename(downloadPath),
      path.dirname(downloadPath)
    )
  } // serveFile

  fileCleanUp (request) {
    if (!isFileDownload(request)) return
    const { downloadKey } = request.params
    if (!downloadKey) return

    const match = this.files.get(downloadKey)
    if (!match) return

    if (match.delete) { fsp.unlink(match.path) }

    this.files.delete(downloadKey)
  } // fileCleanUp
} // FileDownloadingService

function isFileDownload (request) {
  const { raw, params } = request
  return raw.method === 'GET' &&
    prefixPattern.test(raw.url) &&
    params !== null
} // isFileDownload

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}
