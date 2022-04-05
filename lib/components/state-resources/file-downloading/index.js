const path = require('path')

class FileDownloading {
  init (config, env) {
    this.logger = env.bootedServices.logger.child('stateResource:fileDownloading')
    this.bootedServices = env.bootedServices
  } // init

  get fileDownloading () { return this.bootedServices.fileDownloading }

  async run (event, context) {
    const { filePath, fileDirectory = '', deleteAfterDownload, downloadName = null } = event

    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(fileDirectory, filePath)

    if (!path.isAbsolute(fullPath)) {
      this.logger.error(`File path must be absolute. Got ${fullPath}`)
      return context.sendTaskSuccess(`File path must be absolute. Got ${fullPath}`)
    }

    const downloadUrl = this.fileDownloading.addDownloadFile(
      fullPath,
      deleteAfterDownload,
      downloadName
    )

    context.sendTaskSuccess(downloadUrl)
  }
} // class FileDownloadint

module.exports = FileDownloading
