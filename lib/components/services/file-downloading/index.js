class FileDownloadingService {
  async boot (options) {
    const { server, temp } = options.bootedServices
    this.downloadDir = await temp.makeTempDir('download')

    const { app } = server


  } // boot

  addDownloadFile(localFilePath) {
  } // serveFile
} // FileDownloadingService

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}

