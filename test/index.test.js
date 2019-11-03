const nock = require('nock')
const yaml = require('js-yaml')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot } = require('probot')

// Requiring our fixtures
const { api, events, metadata } = require('./fixtures')

const apiDomain = 'https://api.github.com'

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
    this.setup = {
      configRoute(statusCode, config) {
        const { repositoryName, repositoryOwner } = metadata
        const endpoint = `/repos/${repositoryOwner}/${repositoryName}/contents/.github/tasting-menu.yml`

        if(config) {
          const responseBody = api.createContentsResponse(
            yaml.safeDump(config)
          )

          nock(apiDomain)
            .get(endpoint)
            .reply(statusCode, responseBody)
        } else {
          nock(apiDomain)
            .get(endpoint)
            .reply(statusCode)
        }
    },
    issuesRoute(expectedBody) {
      const { issueNum, repositoryName, repositoryOwner } = metadata;
      const endpoint = `/repos/${repositoryOwner}/${repositoryName}/issues/${issueNum}/comments`

      nock(apiDomain)
        .post(endpoint, body => {
          expect(body).toMatchObject({ body: expectedBody })
          return true
        })
        .reply(200)
    }
  }

  this.createConfig = frequencies => ({
    pull_request: { merged: frequencies }
  })

    this.setup

    test('does nothing if the pull request is not merged on close', async () => {
      const payload = events.pull_request.closed.unmerged
      // Receive a webhook event
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('does nothing if config does not exist', async () => {
      this.setup.configRoute(404)

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('does nothing if config file does not contain relevant configs', async () => {
      const config = yaml.safeDump({ pull_request: { notRelevant: {} } })
      this.setup.configRoute(200, config)

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('notifies when no users were chosen to be cc\'ed', async () => {
      const config = this.createConfig([{
        username: 'user1',
        frequency: 0
      }])
      this.setup.configRoute(200, config)
      this.setup.issuesRoute('No collaborators were chosen for this pull request.')

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('comments back based on config if pull request is merged on close', async () => {
      throw new Error()
      const config = yaml.safeDump({ pull_request: { notRelevant: {} } })
      this.setup.configRoute(200, config)

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
