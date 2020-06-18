/* eslint-env mocha */

const PORT = 3003
const HOST = '0.0.0.0'
const jwt = require('jsonwebtoken')
const axios = require('axios')
const expect = require('chai').expect
const tymly = require('@wmfs/tymly')
const path = require('path')
const Buffer = require('safe-buffer').Buffer

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

function sendToken (adminToken) {
  const options = {
    Accept: '*/*'
  }
  if (adminToken) {
    options.authorization = 'Bearer ' + adminToken
  }
  return options
}

describe('Fastify tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let tymlyService, server, adminToken, rupert, alan, statebox, authService
  const secret = 'Shhh!'
  const audience = 'IAmTheAudience!'
  const executionsUrl = `http://localhost:${PORT}/executions/`
  const testEndpointUrl = `http://localhost:${PORT}/test-endpoint/`
  const GET_FROM_API_STATE_MACHINE = 'tymlyTest_getFromApi_1_0'

  describe('start up', () => {
    it('create a usable admin token for Dave', () => {
      adminToken = jwt.sign(
        {},
        Buffer.from(secret, 'base64'),
        {
          subject: 'Dave',
          audience: audience
        }
      )
    })

    it('create some basic tymly services to run a simple cat blueprint', async () => {
      process.env.TEST_API_URL = testEndpointUrl
      process.env.TEST_TOKEN = 'Bearer ' + adminToken

      const tymlyServices = await tymly.boot(
        {
          pluginPaths: [
            path.resolve(__dirname, './../lib'),
            path.resolve(__dirname, './fixtures/plugins/cats-plugin'),
            path.resolve(__dirname, './fixtures/plugins/it-lives-plugin'),
            path.resolve(__dirname, './fixtures/plugins/endpoint-plugin'),
            require.resolve('@wmfs/tymly-rbac-plugin'),
            require.resolve('@wmfs/tymly-solr-plugin'),
            require.resolve('@wmfs/tymly-cardscript-plugin'),
            require.resolve('@wmfs/tymly-rest-client-plugin')
          ],
          blueprintPaths: [
            path.resolve(__dirname, './fixtures/blueprints/cats-blueprint'),
            path.resolve(__dirname, './fixtures/blueprints/it-lives-blueprint'),
            path.resolve(__dirname, './fixtures/blueprints/website-blueprint')
          ],
          config: {
            staticRootDir: path.resolve(__dirname, './output'),
            auth: { secret, audience },
            defaultUsers: {
              Dave: ['tymlyTest_tymlyTestAdmin'],
              Steve: ['spaceCadet']
            }
          }
        }
      )

      tymlyService = tymlyServices.tymly
      authService = tymlyServices.jwtAuth
      server = tymlyServices.server
      statebox = tymlyServices.statebox
      tymlyServices.rbac.debug()
    })

    it('start app', done => {
      server.listen(
        PORT,
        HOST,
        () => {
          console.log('\n')
          console.log(`Example app listening on port ${PORT}!\n`)
          done()
        }
      )
    })

    it('should get cert from auth0 domain', async () => {
      process.env.AUTH0_DOMAIN = 'wmfs'
      const cert = await authService.findCertificate()
      expect(cert)
      expect(cert.includes('BEGIN CERTIFICATE'))
      expect(cert.includes('END CERTIFICATE'))
    })
  })

  // CHECK THAT A VALID JWT REQUIRED TO USE /TYMLY'S API
  // ---------------------------------------------------
  describe('don\'t do anything without a JWT', () => {
    it('fail to create a new Tymly without a JWT', done => {
      axios({
        url: executionsUrl,
        method: 'POST',
        data: {
          stateMachineName: 'tymlyTest_cat_1_0',
          data: { petName: 'Rupert' }
        }
      }).catch(err => {
        expect(err.message).to.eql('Request failed with status code 401')
        done()
      })
    })

    it('fail updating a Tymly without a JWT', done => {
      axios({
        url: executionsUrl + alan,
        method: 'PUT',
        data: {
          action: 'SendTaskHeartbeat',
          output: {
            sound: 'Car engine'
          }
        }
      }).catch(err => {
        expect(err.message).to.eql('Request failed with status code 401')
        done()
      })
    })

    it('fail getting a Tymly without a JWT', done => {
      axios({
        url: executionsUrl + rupert,
        method: 'GET'
      }).catch(err => {
        expect(err.message).to.eql('Request failed with status code 401')
        done()
      })
    })
  })

  describe('run cat execution', () => {
    it('create a new Rupert execution', async () => {
      const res = await axios({
        url: executionsUrl,
        method: 'post',
        data: {
          stateMachineName: 'tymlyTest_cat_1_0',
          input: {
            petName: 'Rupert',
            gender: 'male',
            hoursSinceLastMotion: 11,
            hoursSinceLastMeal: 5,
            petDiary: []
          },
          options: {
            instigatingClient: {
              appName: 'tymly-fastify-plugin',
              domain: 'fastify'
            }
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.eql(201)
      expect(res.data.status).to.eql('RUNNING')
      expect(res.data.currentStateName).to.eql('WakingUp')
      expect(res.data.ctx.petName).to.eql('Rupert')
      expect(res.data.executionOptions).to.eql(
        {
          action: 'startExecution',
          instigatingClient: {
            appName: 'tymly-fastify-plugin',
            domain: 'fastify'
          },
          stateMachineName: 'tymlyTest_cat_1_0',
          userId: 'Dave'
        }
      )

      rupert = res.data.executionName
    })

    it('get Rupert execution description', async () => {
      const res = await axios({
        url: executionsUrl + rupert,
        method: 'get',
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
      expect(res.data.ctx.petName).to.equal('Rupert')
    })

    it('successfully complete Rupert\'s day', async () => {
      const execDesc = await statebox.waitUntilStoppedRunning(rupert)

      expect(execDesc.status).to.eql('SUCCEEDED')
      expect(execDesc.stateMachineName).to.eql('tymlyTest_cat_1_0')
      expect(execDesc.currentStateName).to.eql('Sleeping')
      expect(execDesc.ctx.hoursSinceLastMeal).to.eql(0)
      expect(execDesc.ctx.hoursSinceLastMotion).to.eql(0)
      expect(execDesc.ctx.gender).to.eql('male')
      expect(execDesc.ctx.petDiary).to.be.an('array')
      expect(execDesc.ctx.petDiary[0]).to.equal('Look out, Rupert is waking up!')
      expect(execDesc.ctx.petDiary[2]).to.equal('Rupert is walking... where\'s he off to?')
      expect(execDesc.ctx.petDiary[6]).to.equal('Shh, Rupert is eating...')
    })
  })

  describe('run another cat execution', () => {
    it('create a new Alan execution', async () => {
      const res = await axios({
        url: executionsUrl,
        method: 'post',
        data: {
          stateMachineName: 'tymlyTest_listeningCat_1_0',
          input: {
            petName: 'Alan',
            gender: 'male',
            petDiary: []
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(201)
      expect(res.data.status).to.eql('RUNNING')
      expect(res.data.currentStateName).to.eql('WakingUp')
      expect(res.data.ctx.petName).to.eql('Alan')

      alan = res.data.executionName
    })

    it('wait a while', done => { setTimeout(done, 250) })

    it('update Alan execution with a heartbeat', async () => {
      const res = await axios({
        url: executionsUrl + alan,
        method: 'put',
        data: {
          action: 'SendTaskHeartbeat',
          output: {
            sound: 'Car engine'
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
      expect(res.data.status).to.equal('RUNNING')
      expect(res.data.currentStateName).to.equal('Listening')
      expect(res.data.ctx.sound).to.equal('Car engine')
    })

    it('wait a while longer', done => { setTimeout(done, 250) })

    it('sendTaskSuccess() to the Alan execution', async () => {
      const res = await axios({
        url: executionsUrl + alan,
        method: 'put',
        data: {
          action: 'SendTaskSuccess',
          output: {
            order: [
              {
                product: 'Fresh Tuna',
                quantity: 25
              }
            ]
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
    })

    it('successfully complete Alans\'s awakening', async () => {
      const execDesc = await statebox.waitUntilStoppedRunning(alan)

      expect(execDesc.status).to.eql('SUCCEEDED')
      expect(execDesc.stateMachineName).to.eql('tymlyTest_listeningCat_1_0')
      expect(execDesc.currentStateName).to.eql('Sleeping')
      expect(execDesc.ctx.gender).to.eql('male')
      expect(execDesc.ctx.petDiary).to.be.an('array')
      expect(execDesc.ctx.petDiary[0]).to.equal('Look out, Alan is waking up!')
      expect(execDesc.ctx.petDiary[1]).to.equal('Alan is listening for something... what will he hear?')
      expect(execDesc.ctx.petDiary[2]).to.equal('Sweet dreams Alan! x')
      expect(execDesc.ctx.order[0]).to.eql(
        {
          product: 'Fresh Tuna',
          quantity: 25
        }
      )
    })

    it('create another new Alan execution', async () => {
      const res = await axios({
        url: executionsUrl,
        method: 'post',
        data: {
          stateMachineName: 'tymlyTest_listeningCat_1_0',
          input: {
            petName: 'Alan',
            gender: 'male',
            petDiary: []
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(201)
      expect(res.data.status).to.eql('RUNNING')
      expect(res.data.currentStateName).to.eql('WakingUp')
      expect(res.data.ctx.petName).to.eql('Alan')

      alan = res.data.executionName
    })

    it('cancel a new Alan tymly', async () => {
      const res = await axios({
        url: executionsUrl + alan,
        method: 'delete',
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(204)
    })

    it('get stopped Alan execution-description', async () => {
      const res = await axios({
        url: executionsUrl + alan,
        method: 'get',
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
      expect(res.data.ctx.petName).to.equal('Alan')
      expect(res.data.status).to.equal('STOPPED')
      expect(res.data.errorCode).to.equal('STOPPED')
      expect(res.data.errorMessage).to.equal('Execution stopped externally')
    })

    it('start state machine to claim from an API (our localhost booted address [remit]) and expect the header to be taken through, and sensible data to be returned', async () => {
      const execDesc = await statebox.startExecution(
        {},
        GET_FROM_API_STATE_MACHINE,
        {
          sendResponse: 'COMPLETE',
          userId: 'Dave'
        }
      )

      expect(execDesc.currentStateName).to.eql('GetDataFromRestApi')
      expect(execDesc.stateMachineName).to.eql('tymlyTest_getFromApi_1_0')
      expect(execDesc.ctx.stateMachinesUserCanStart)
      expect(execDesc.ctx.forms)
      expect(execDesc.status).to.eql('SUCCEEDED')
    })
  })

  describe('restart a failed execution', () => {
    let frankenstein

    it('start', async () => {
      const res = await axios({
        url: executionsUrl,
        method: 'post',
        data: {
          stateMachineName: 'tymlyTest_helloFailButLiveAgain',
          input: {},
          options: {
            instigatingClient: {
              appName: 'tymly-fastify-plugin',
              domain: 'fastify'
            }
          }
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(201)
      expect(res.data.status).to.eql('RUNNING')
      expect(res.data.currentStateName).to.eql('Hello')
      expect(res.data.executionOptions).to.eql(
        {
          action: 'startExecution',
          instigatingClient: {
            appName: 'tymly-fastify-plugin',
            domain: 'fastify'
          },
          stateMachineName: 'tymlyTest_helloFailButLiveAgain',
          userId: 'Dave'
        }
      )

      frankenstein = res.data.executionName
    })

    it('wait a while', done => { setTimeout(done, 250) })

    it('oh dear, it has failed', async () => {
      const res = await axios({
        url: executionsUrl + frankenstein,
        method: 'get',
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
      expect(res.data.status).to.eql('FAILED')
      expect(res.data.stateMachineName).to.eql('tymlyTest_helloFailButLiveAgain')
      expect(res.data.currentStateName).to.eql('Stuttery')
    })

    it('bring back to life', async () => {
      const res = await axios({
        url: executionsUrl + frankenstein,
        method: 'put',
        data: {
          action: 'SendTaskRevivification'
        },
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
    })

    it('wait a while again', done => { setTimeout(done, 250) })

    it('yes, the machine has restarted', async () => {
      const res = await axios({
        url: executionsUrl + frankenstein,
        method: 'get',
        headers: sendToken(adminToken)
      })

      expect(res.status).to.equal(200)
      expect(res.data.status).to.eql('SUCCEEDED')
      expect(res.data.stateMachineName).to.eql('tymlyTest_helloFailButLiveAgain')
      expect(res.data.currentStateName).to.eql('IT-LIVES')
    })
  })

  describe('clean up', () => {
    it('shutdown Tymly', async () => {
      await tymlyService.shutdown()
    })
  })
})
