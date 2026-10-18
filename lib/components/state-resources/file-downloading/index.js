const path = require('path')

class FileDownloading {
  init (config, env) {
    this.logger = env.bootedServices.logger.child('stateResource:fileDownloading')
    this.bootedServices = env.bootedServices
  } // init

  get fileDownloading () { return this.bootedServices.fileDownloading }

  async run (event, context) {
    const { filePath, fileDirectory, deleteAfterDownload = false, downloadName = null } = event

    const fullPath = resolveDownloadPath(filePath, fileDirectory)

    if (!fullPath.ok) {
      this.logger.error(fullPath.error)
      return context.sendTaskFailure({ error: 'fileDownloading', cause: fullPath.error })
    }

    const downloadUrl = this.fileDownloading.addDownloadFile(
      fullPath.path,
      deleteAfterDownload === true,
      downloadName
    )

    context.sendTaskSuccess(downloadUrl)
  }
} // class FileDownloading

function resolveDownloadPath (filePath, fileDirectory) {
  if (typeof filePath !== 'string' || filePath === '') {
    return { ok: false, error: 'File path must be a non-empty string' }
  }

  if (fileDirectory) {
    // When a directory is given the file must stay inside it, so a
    // client-supplied filename can't use '../' or an absolute path to escape.
    const dir = path.resolve(fileDirectory)
    const full = path.resolve(dir, filePath)
    if (full !== dir && full.startsWith(dir + path.sep)) {
      return { ok: true, path: full }
    }
    return { ok: false, error: `File path '${filePath}' is outside directory '${fileDirectory}'` }
  }

  if (!path.isAbsolute(filePath)) {
    return { ok: false, error: `File path must be absolute. Got ${filePath}` }
  }

  return { ok: true, path: path.normalize(filePath) }
} // resolveDownloadPath

module.exports = FileDownloading
