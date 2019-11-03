const nock = require('nock')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot } = require('probot')

// Requiring our fixtures
const payloads = {
  pull_request: {
    unmerged: require('./fixtures/pull_request.closed.unmerged')
  }
}

nock.disableNetConnect()

describe('Tasting Menu', () => {

  beforeEach(() => {
    this.probot = probot = new Probot({})
    // Load our app into probot
    const app = probot.load(myProbotApp)

    // just return a test token
    app.app = () => 'test'
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
  })

  test('does nothing if the pull request is not merged', async () => {
    // Receive a webhook event
    await this.probot.receive({
      name: 'pull_request',
      payload: payloads.pull_request.unmerged
    })
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
