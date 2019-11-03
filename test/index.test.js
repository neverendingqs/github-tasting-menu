const nock = require('nock')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot } = require('probot')

// Requiring our fixtures
const { api, events, metadata } = require('./fixtures')

const config = `
pull_request:
  merged:
    - username: github-username-1
      frequency: 0.5
    - username: github-username-2
      frequency: 0.25
    - username: github-username-3
      frequency: 0.33
    - username: github-username-4
      frequency: 0.75
`

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
      const payload = events.pull_request.closed.unmerged
      // Receive a webhook event
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('comments back based on config if pull request is merged on close', async () => {
      const { repositoryName, repositoryOwner } = metadata;

      nock('https://api.github.com')
        .get(`/repos/${repositoryOwner}/${repositoryName}/contents/.github/tasting-menu.yml`)
        .reply(200, api.createContentsResponse(config))

      // Receive a webhook event
      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
