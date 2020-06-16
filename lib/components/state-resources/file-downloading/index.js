class FileDownloading {
  init (config, env) {
    this.downloadService = env.bootedServices.fileDownloading
  } // init

  async run (event, context) {
    context.sendTaskFailure()
  }
} // class FileDownloadint

module.exports = FileDownloading
