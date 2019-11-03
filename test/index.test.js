const nock = require('nock')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot } = require('probot')

// Requiring our fixtures
const payloads = {
  pull_request: {
    merged: require('./fixtures/pull_request.closed.merged'),
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

  describe('pull_request', () => {

    test('does nothing if the pull request is not merged on close', async () => {
      const payload = payloads.pull_request.unmerged
      // Receive a webhook event
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('comments back based on config if pull request is merged on close', async () => {
      const payload = payloads.pull_request.merged

      nock('https://api.github.com')
        .get(`/repos/hiimbex/testing-things/contents/.github/tasting-menu.yml`)
        .reply(200)

      // Receive a webhook event
      await this.probot.receive({ name: 'pull_request', payload })
    })

  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
