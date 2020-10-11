const issueNum = 5
const repositoryName = 'repository-name'
const repositoryOwner = 'repository-owner'
const username = 'username'

function createPullRequestEvent (merged = true) {
  return {
    action: 'closed',
    pull_request: {
      number: issueNum,
      user: { login: username },
      merged
    },
    repository: {
      name: repositoryName,
      owner: { login: repositoryOwner }
    }
  }
}

module.exports = {
  events: {
    pull_request: {
      closed: {
        merged: createPullRequestEvent(true),
        unmerged: createPullRequestEvent(false)
      }
    }
  },
  metadata: {
    issueNum,
    repositoryName,
    repositoryOwner,
    username
  }
}
