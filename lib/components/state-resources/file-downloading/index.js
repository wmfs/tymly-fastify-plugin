class FileDownloading {
  init (config, env) {
    this.bootedServices = env.bootedServices
  } // init

  get fileDownloading () { return this.bootedServices.fileDownloading }

  async run (event, context) {
    const { filePath, deleteAfterDownload } = event

    const downloadUrl = this.fileDownloading.addDownloadFile(
      filePath,
      deleteAfterDownload
    )

    context.sendTaskSuccess(downloadUrl)
  }
} // class FileDownloadint

module.exports = FileDownloading
