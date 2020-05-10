const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');
const binaryMimeTypes = [
  'image/gif',
  'text/css',
  'text/html'
];

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes);

module.exports.express = (event, context) => awsServerlessExpress.proxy(server, event, context);
