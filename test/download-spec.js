/* eslint-env mocha */

const PORT = 3003
const HOST = '0.0.0.0'
const chai = require('chai')
chai.use(require('chai-string'))
const expect = chai.expect
const tymly = require('@wmfs/tymly')
const path = require('path')
const fsp = require('fs').promises
const axios = require('axios')

describe('Download tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const baseUrl = `http://localhost:${PORT}`

  const testFile = path.join(__dirname, 'fixtures', 'download', 'fixture.txt')

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

  it('add a file for download', () => {
    downloadPath = downloadService.addDownloadFile(testFile)

    expect(downloadPath).to.include('/download/')
  })

  it('download the file', async () => {
    const download = await axios({
      url: baseUrl + downloadPath,
      method: 'GET'
    })
    expect(download.status).to.eql(200)

    const testFileContents = await fsp.readFile(testFile, 'utf8')
    expect(download.data).to.eql(testFileContents)
  })

  it('bad key gives 404', async () => {
    let download = null
    try {
      await axios({
        url: baseUrl + '/download/nonsense',
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
  })

  after('shutdown tymly', async () => {
    await tymlyService.shutdown()
  })
})
