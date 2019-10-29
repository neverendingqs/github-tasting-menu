const _ = {
  get: require('lodash.get')
};

async function getConfig(context) {
  const config = await context.config('tasting-menu.yml');
  if(!config) { return Promise.resolve(); }
  return config;
}

function getUsersToNotify(frequencies) {
  return frequencies
    .filter(({ frequency }) => Math.random() < frequency)
    .map(({ username }) => username);
}

async function verifyUsers(context, users) {
  const collaborators = [];
  const nonCollaborators = [];

  for(const username of users) {
    try {
      const response = await context.github.repos.checkCollaborator({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        username
      });

      switch(response.status) {
        case 204:
          collaborators.push(username);
          break;
        default:
          nonCollaborators.push(username);
      }
    } catch(err) {
      nonCollaborators.push(username);
    }
  }

  return { collaborators, nonCollaborators };
}

function constructBody(collaborators, nonCollaborators) {
  let body = '';
  if(collaborators.length > 0) {
    body += `cc: ${collaborators.map(username => `@${username}`).join(' ')}\n\n`;
  }

  if(nonCollaborators.length > 0) {
    body += `Non-collaborators / non-existent users that were not notified: \n\n - ${nonCollaborators.join('\n - ')}`;
  }

  return body;
}

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')

  app.on(['pull_request.closed'], async context => {
    if(!_.get(context, 'payload.pull_request.merged', true)) {
      return Promise.resolve();
    }

    const config = await getConfig(context);
    if(!config) { return Promise.resolve(); }

    const frequencies = _.get(config, 'pull_request.merged');
    if(!frequencies) { return Promise.resolve(); }

    const users = getUsersToNotify(frequencies);
    const { collaborators, nonCollaborators } = await verifyUsers(context, users);
    const body = constructBody(collaborators, nonCollaborators) || 'No collaborators were chosen for this pull request.';

    const issueComment = context.issue({ body });
    return context.github.issues.createComment(issueComment);
  });
}
