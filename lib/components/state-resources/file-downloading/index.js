const path = require('path')

class FileDownloading {
  init (config, env) {
    this.bootedServices = env.bootedServices
  } // init

  get fileDownloading () { return this.bootedServices.fileDownloading }

  async run (event, context) {
    const { filePath, fileDirectory = '', deleteAfterDownload, downloadName = null } = event

    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(fileDirectory, filePath)

    if (!path.isAbsolute(fullPath)) {
      console.log(`File path must be absolute. Got ${fullPath}`)
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
