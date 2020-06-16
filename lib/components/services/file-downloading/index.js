class FileDownloadingService {
  async boot (options) {

  } // boot

  serveFile(localFilePath) {
  } // serveFile
} // FileDownloadingService

module.exports = {
  serviceClass: FileDownloadingService,
  bootAfter: ['server']
}

