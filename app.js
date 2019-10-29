const { toLambda } = require("probot-serverless-now");

const applicationFunction = require("./index.js");

module.exports = toLambda(applicationFunction);
