const _ = {
  get: require('lodash.get')
};

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */
module.exports = app => {
  // Your code here
  app.log('Yay, the app was loaded!')

  app.on(['pull_request.closed'], async context => {
    if(!_.get(context, 'payload.pull_request.merged', true)) {
      return Promise.resolve();
    }

    const userToNotify = 'neverendingqs';

    const response = await context.github.repos.checkCollaborator({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      username: userToNotify
    });

    if(response.status !== 204) {
      return Promise.resolve();
    }

    const issueComment = context.issue({ body: `cc: @${userToNotify}` });
    return context.github.issues.createComment(issueComment);
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
