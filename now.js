// Based on https://github.com/chadfawcett/probot-serverless-now/blob/master/index.js
const { createProbot } = require('probot')
const { getPrivateKey } = require('@probot/get-private-key')

const app = require('./')
const probot = createProbot({
  id: process.env.APP_ID,
  secret: process.env.WEBHOOK_SECRET,
  cert: getPrivateKey()
})
probot.load(app)

module.exports = probot.server
