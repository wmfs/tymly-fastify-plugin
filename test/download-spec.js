/* eslint-env mocha */

const PORT = 3003
const HOST = '0.0.0.0'
const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const tymly = require('@wmfs/tymly')
const path = require('path')
const fs = require('fs')
const fsp = fs.promises
const axios = require('axios')

describe('Download tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const baseUrl = `http://localhost:${PORT}`

  const testFile = path.join(__dirname, 'fixtures', 'download', 'fixture.txt')
  const testCopyFile = path.join(__dirname, 'fixtures', 'download', 'copy.txt')

  let tymlyService, downloadService
  let downloadPath

  before('start tymly', async () => {
    const tymlyServices = await tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
        ],
        config: {
          staticRootDir: path.resolve(__dirname, './output'),
          auth: { secret, audience }
        }
      }
    )

    tymlyService = tymlyServices.tymly
    downloadService = tymlyServices.fileDownloading
    const server = tymlyServices.server
    server.listen(PORT, HOST, () => {
      console.log(`Listening on ${PORT}`)
    })
  })

  describe('download file', () => {
    it('add a file for download', () => {
      downloadPath = downloadService.addDownloadFile(testFile, false)

      expect(downloadPath).to.include('/download/')
    })

    it('download the file', async () => {
      await expect200(downloadPath, testFile)
    })

    it('file is not deleted', () => {
      const fileFound = fs.existsSync(testFile)
      expect(fileFound).to.eql(true)
    })
  })

  describe('download file, delete afterwards', () => {
    before('copy file', async () => {
      await fsp.copyFile(testFile, testCopyFile)
    })

    it('add file for download, mark as deletable', () => {
      downloadPath = downloadService.addDownloadFile(testCopyFile, true)

      expect(downloadPath).to.include('/download/')
    })

    it('download the file', async () => {
      await expect200(downloadPath, testCopyFile)
    })

    it('file is deleted', () => {
      const fileFound = fs.existsSync(testCopyFile)

      expect(fileFound).to.eql(false)
    })
  })

  describe('download keys can only be used once', () => {
    it('add a file for download', () => {
      downloadPath = downloadService.addDownloadFile(testFile, false)

      expect(downloadPath).to.include('/download/')
    })

    it('download the file', async () => {
      await expect200(downloadPath, testFile)
    })

    it('download again, get 404', async () => {
      await expect404(downloadPath)
    })
  })

  it('bad key gives 404', async () => {
    await expect404('/download/nonsense')
  })

  after('shutdown tymly', async () => {
    await tymlyService.shutdown()
  })

  async function expect200(downloadPath, filePath) {
    const testFileContents = await fsp.readFile(filePath, 'utf8')

    const download = await axios({
      url: baseUrl + downloadPath,
      method: 'GET'
    })

    expect(download.status).to.eql(200)
    expect(download.data).to.eql(testFileContents)
  } // expect200

  async function expect404(downloadPath) {
    let download = null
    try {
      await axios({
        url: baseUrl + downloadPath,
        method: 'GET'
      })
    } catch (err) {
      download = err
    }

    if (!download) {
      return expect.fail('Should have thrown with a 404 error')
    }

    expect(download.isAxiosError).to.eql(true)
    expect(download.response.status).to.eql(404)
  } // expect404

})
