const path = require('path')
const fsp = require('fs').promises
const { v4: uuid } = require('uuid')

const downloadPrefix = '/download'

class FileDownloadingService {
  async boot (options) {
    const { server, jwtAuth } = options.bootedServices
    this.logger = options.bootedServices.logger.child('service:fileDownloading')
    this.jwtAuth = jwtAuth

    this.files = new Map()

    const { app } = server
    const router = async app => {
      const opts = {
        preValidation: [app.jwtCheck]
      }
      app.get('/:downloadKey', opts, (request, reply) => this.serveFile(request, reply))

      // Scoped to the download routes only. Must be async (or call done),
      // otherwise Fastify never runs later onResponse hooks.
      app.addHook('onResponse', async (request, reply) => this.fileCleanUp(request, reply))
    }

    app.register(router, { prefix: downloadPrefix })
  } // boot

  addDownloadFile (
    localFilePath,
    deleteAfterDownload = false,
    downloadName = null
  ) {
    const fileUuid = uuid()
    this.files.set(fileUuid, {
      path: localFilePath,
      delete: deleteAfterDownload === true,
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
      reply.header('Content-Disposition', contentDisposition(match.name))
    }

    const downloadPath = match.path
    return reply.sendFile(
      path.basename(downloadPath),
      path.dirname(downloadPath)
    )
  } // serveFile

  async fileCleanUp (request, reply) {
    // Only spend the download key once the file has actually been served -
    // a 401 or a failed send shouldn't burn it.
    if (reply.statusCode < 200 || reply.statusCode >= 300) return

    const { downloadKey } = request.params || {}
    if (!downloadKey) return

    const match = this.files.get(downloadKey)
    if (!match) return

    this.files.delete(downloadKey)

    if (match.delete) {
      try {
        await fsp.unlink(match.path)
      } catch (err) {
        this.logger.error(`Failed to delete downloaded file ${match.path}: ${err.message}`)
      }
    }
  } // fileCleanUp
} // FileDownloadingService

function contentDisposition (filename) {
  const name = path.basename(String(filename))
  // ASCII fallback with quotes, backslashes and control characters removed,
  // plus an RFC 5987 encoded version for non-ASCII names.
  const fallback = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  const encoded = encodeURIComponent(name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`
} // contentDisposition

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server', 'jwtAuth']
}
