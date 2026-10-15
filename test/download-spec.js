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
const jwt = require('jsonwebtoken')

describe('Download tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const baseUrl = `http://localhost:${PORT}`

  const testFile = path.join(__dirname, 'fixtures', 'download', 'fixture.txt')
  const testCopyFile = path.join(__dirname, 'fixtures', 'download', 'copy.txt')

  let tymlyService, downloadService, uploadService, statebox
  let downloadPath
  let token

  before('start tymly', async () => {
    const tymlyServices = await tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, './../lib')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/blueprints/file-download-blueprint')
        ],
        config: {
          staticRootDir: path.resolve(__dirname, './output'),
          auth: { secret, audience }
        }
      }
    )

    tymlyService = tymlyServices.tymly
    downloadService = tymlyServices.fileDownloading
    uploadService = tymlyServices.fileUploading
    statebox = tymlyServices.statebox
    token = jwt.sign({}, Buffer.from(secret, 'base64'), { subject: 'test', audience })
    const server = tymlyServices.server
    server.listen(PORT, HOST, (err) => {
      expect(err).to.eql(null)
      console.log(`Listening on ${PORT}`)
    })
  })

  describe('service tests', () => {
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

      it('file is deleted', async () => {
        // Deletion happens in onResponse, which can finish after the client has the response
        const fileFound = await existsAfterSettling(testCopyFile)

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
  }) // service

  describe('state resource tests', () => {
    describe('download a file', () => {
      it('add a file for download', async () => {
        const context = await statebox.startExecution(
          {
            filePath: testFile,
            deleteAfterwards: false
          },
          'tymlyTest_fileDownload',
          {
            sendResponse: 'COMPLETE'
          }
        )

        downloadPath = context.ctx.downloadPath
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

      it('add file for download, mark as deletable', async () => {
        const context = await statebox.startExecution(
          {
            filePath: testCopyFile,
            deleteAfterwards: true
          },
          'tymlyTest_fileDownload',
          {
            sendResponse: 'COMPLETE'
          }
        )

        downloadPath = context.ctx.downloadPath
        expect(downloadPath).to.include('/download/')
      })

      it('download the file', async () => {
        await expect200(downloadPath, testCopyFile)
      })

      it('file is deleted', async () => {
        // Deletion happens in onResponse, which can finish after the client has the response
        const fileFound = await existsAfterSettling(testCopyFile)

        expect(fileFound).to.eql(false)
      })
    })
  })

  describe('safety checks', () => {
    const fixtureDir = path.dirname(testFile)

    it('files are not deleted unless asked', async () => {
      await fsp.copyFile(testFile, testCopyFile)
      downloadPath = downloadService.addDownloadFile(testCopyFile)
      await expect200(downloadPath, testCopyFile)
      expect(fs.existsSync(testCopyFile)).to.eql(true)
      await fsp.unlink(testCopyFile)
    })

    it('an unauthenticated request does not use up the download key', async () => {
      downloadPath = downloadService.addDownloadFile(testFile)

      let status = null
      try {
        await axios({ url: baseUrl + downloadPath, method: 'GET' })
      } catch (err) {
        status = err.response.status
      }
      expect(status).to.eql(401)

      await expect200(downloadPath, testFile)
    })

    it('download name is safely encoded in Content-Disposition', async () => {
      downloadPath = downloadService.addDownloadFile(testFile, false, 'résumé "final".txt')

      const download = await axios({
        url: baseUrl + downloadPath,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token }
      })

      expect(download.status).to.eql(200)
      expect(download.headers['content-disposition']).to.eql(
        'attachment; filename="r_sum_ _final_.txt"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9%20%22final%22.txt'
      )
    })

    it('a file inside the given directory can be downloaded', async () => {
      const context = await statebox.startExecution(
        { filePath: 'fixture.txt', fileDirectory: fixtureDir },
        'tymlyTest_fileDownloadInDirectory',
        { sendResponse: 'COMPLETE' }
      )

      expect(context.status).to.eql('SUCCEEDED')
      await expect200(context.ctx.downloadPath, testFile)
    })

    for (const badPath of ['../../../package.json', path.resolve(__dirname, '..', 'package.json')]) {
      it(`refuses to escape the given directory (${badPath})`, async () => {
        const context = await statebox.startExecution(
          { filePath: badPath, fileDirectory: fixtureDir },
          'tymlyTest_fileDownloadInDirectory',
          { sendResponse: 'COMPLETE' }
        )

        expect(context.status).to.eql('FAILED')
        expect(context.ctx.downloadPath).to.eql(undefined)
      })
    }

    it('refuses a relative path with no directory', async () => {
      const context = await statebox.startExecution(
        { filePath: 'fixture.txt', deleteAfterwards: false },
        'tymlyTest_fileDownload',
        { sendResponse: 'COMPLETE' }
      )

      expect(context.status).to.eql('FAILED')
    })
  })

  describe('upload', () => {
    async function upload (bytes, fields = {}) {
      const form = new FormData()
      for (const [name, value] of Object.entries(fields)) form.append(name, value)
      form.append('file', new Blob([Buffer.alloc(bytes, 'a')]), 'test.txt')

      return fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: form
      })
    }

    it('an upload with no endpoint is not left on disk', async () => {
      const before = await fsp.readdir(uploadService.uploadDir)

      const res = await upload(10)
      expect(res.status).to.eql(200)
      expect(await res.json()).to.eql({})

      const after = await fsp.readdir(uploadService.uploadDir)
      expect(after).to.eql(before)
    })

    it('an oversized upload is rejected and cleaned up', async () => {
      const before = await fsp.readdir(uploadService.uploadDir)

      const res = await upload(2 * 1024 * 1024, { endpoint: 'tymlyTest_fileDownload' })
      expect(res.status).to.eql(413)

      const after = await fsp.readdir(uploadService.uploadDir)
      expect(after).to.eql(before)
    })

    it('a failed post-upload state machine is reported as an error', async () => {
      const res = await upload(10, { endpoint: 'tymlyTest_noSuchMachine' })
      expect(res.status).to.eql(500)
      const body = await res.json()
      expect(body.status).to.eql('STATE_MACHINE_NOT_FOUND')
    })
  })

  after('shutdown tymly', async () => {
    await tymlyService.shutdown()
  })

  async function existsAfterSettling (filePath) {
    for (let i = 0; i < 20 && fs.existsSync(filePath); i++) {
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    return fs.existsSync(filePath)
  } // existsAfterSettling

  async function expect200 (downloadPath, filePath) {
    const testFileContents = await fsp.readFile(filePath, 'utf8')

    const download = await axios({
      url: baseUrl + downloadPath,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token }
    })

    expect(download.status).to.eql(200)
    expect(download.data).to.eql(testFileContents)
  } // expect200

  async function expect404 (downloadPath) {
    let download = null
    try {
      await axios({
        url: baseUrl + downloadPath,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token }
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
