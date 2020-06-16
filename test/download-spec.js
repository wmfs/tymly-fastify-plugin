/* eslint-env mocha */

const PORT = 3003
const HOST = '0.0.0.0'
const expect = require('chai').expect
const tymly = require('@wmfs/tymly')
const path = require('path')

describe('Download tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'

  const testFile = path.join(__dirname, 'fixtures', 'download', 'fixture.txt')

  let tymlyService, downloadService

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
          auth: { secret, audience },
        }
      }
    )

    tymlyService = tymlyServices.tymly
    downloadService = tymlyServices.fileDownloading
  })

  it ('add a file for download', () => {
    const url = downloadService.addDownloadFile(testFile)

    expect(url).to.include('/download/')
  })

  after('shutdown tymly', async () => {
    await tymlyService.shutdown()
  })
})
