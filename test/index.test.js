const nock = require('nock')
const yaml = require('js-yaml')

// Requiring our app implementation
const myProbotApp = require('..')
const { Probot, ProbotOctokit } = require('probot')

// Requiring our fixtures
const { api, events, metadata } = require('./fixtures')

const apiDomain = 'https://api.github.com'

describe('Tasting Menu', () => {
  beforeEach(() => {
    // https://probot.github.io/docs/testing/
    nock.disableNetConnect()

    this.probot = new Probot({
      id: 1,
      githubToken: 'test',
      // Disable throttling & retrying requests for easier testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false }
      })
    })

    // Load our app into probot
    this.probot.load(myProbotApp)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      console.log(nock.pendingMocks())
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
  })

  describe('pull_request', () => {
    this.setup = {
      configRoute (statusCode, config) {
        const { repositoryName, repositoryOwner } = metadata
        // `%2F` instead of `/`
        // https://github.com/probot/probot/releases/tag/v10.0.0
        const endpoint = `/repos/${repositoryOwner}/${repositoryName}/contents/.github%2Ftasting-menu.yml`

        if (config) {
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
      collaboratorsRoute (username, statusCode = 204) {
        const { repositoryName, repositoryOwner } = metadata
        const endpoint = `/repos/${repositoryOwner}/${repositoryName}/collaborators/${username}`

        nock(apiDomain)
          .get(endpoint)
          .reply(statusCode)
      },
      issuesRoute (expectedBody) {
        const { issueNum, repositoryName, repositoryOwner } = metadata
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

    test('does nothing if the pull request is not merged on close', async () => {
      const payload = events.pull_request.closed.unmerged
      // Receive a webhook event
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('does nothing if config does not exist', async () => {
      this.setup.configRoute(404)

      const { repositoryOwner } = metadata
      // Checks for a global '.github' repo if local repo doesn't contain a config
      // https://github.com/probot/probot/issues/1051
      nock(apiDomain)
        .get(`/repos/${repositoryOwner}/.github/contents/.github%2Ftasting-menu.yml`)
        .reply(404)

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('does nothing if config file does not contain relevant configs', async () => {
      this.setup.configRoute(200, { pull_request: { notRelevant: {} } })

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('notifies when no users were chosen to be cc\'ed', async () => {
      const config = this.createConfig([
        { username: 'user1', frequency: 0 }
      ])
      this.setup.configRoute(200, config)
      this.setup.issuesRoute('No collaborators were chosen for this pull request.')

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('notifies when all users were chosen', async () => {
      const users = ['user1', 'user2']

      const config = this.createConfig(
        users.map(username => ({ username, frequency: 1 }))
      )
      this.setup.configRoute(200, config)

      users.forEach(username => this.setup.collaboratorsRoute(username))
      this.setup.issuesRoute(`cc: @${users.join(' @')}\n\n`)

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('notifies users are not a collaborator', async () => {
      const users = ['user1', 'user2']

      const config = this.createConfig(
        users.map(username => ({ username, frequency: 1 }))
      )
      this.setup.configRoute(200, config)

      users.forEach(username => this.setup.collaboratorsRoute(username, 404))
      this.setup.issuesRoute(`Non-collaborators / non-existent users that were not notified: \n\n - ${users.join('\n - ')}`)

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })

    test('skips users based on their frequency', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.6)

      try {
        const config = this.createConfig([
          { username: 'user1', frequency: 0.5 },
          { username: 'user2', frequency: 0.75 }
        ])
        this.setup.configRoute(200, config)

        this.setup.collaboratorsRoute('user2')
        this.setup.issuesRoute('cc: @user2\n\n')

        const payload = events.pull_request.closed.merged
        await this.probot.receive({ name: 'pull_request', payload })
      } finally {
        global.Math.random.mockRestore()
      }
    })

    test('notifies appropriately when there are collaborators and non-collaborators', async () => {
      jest.setTimeout(10000)
      const collaborators = ['user1', 'user2']
      const nonCollaborators = ['user3', 'user4']

      const config = this.createConfig(
        [...collaborators, ...nonCollaborators].map(username => ({ username, frequency: 1 }))
      )
      this.setup.configRoute(200, config)

      collaborators.forEach(username => this.setup.collaboratorsRoute(username))
      nonCollaborators.forEach(username => this.setup.collaboratorsRoute(username, 404))

      this.setup.issuesRoute(
        `cc: @${collaborators.join(' @')}\n\n` +
        `Non-collaborators / non-existent users that were not notified: \n\n - ${nonCollaborators.join('\n - ')}`
      )

      const payload = events.pull_request.closed.merged
      await this.probot.receive({ name: 'pull_request', payload })
    })
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about testing with Nock see:
// https://github.com/nock/nock
