'use strict';

/* *
 * This sample demonstrates handling intents from an Alexa skill
 * using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional
 * examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const express = require('express');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
let { MongoDBPersistenceAdapter } = require('ask-sdk-mongodb-persistence-adapter');

let { LaunchRequestHandler } = require('./intents/launchRequestHandler');
let { HelloWorldIntentHandler } = require('./intents/helloWorldIntentHandler');
let { HelpIntentHandler } = require('./intents/helpIntentHandler');
let { CancelAndStopIntentHandler } = require('./intents/cancelAndStopIntentHandler');
let { FallbackIntentHandler } = require('./intents/fallbackIntentHandler');
let { SessionEndedRequestHandler } = require('./intents/sessionEndedRequestHandler');
let { IntentReflectorHandler } = require('./intents/intentReflectorHandler');
let { ErrorHandler } = require('./errors/errorHandler');
let { LocalisationRequestInterceptor } = require('./interceptors/localisationRequestInterceptor');

const connOpts = {
  host: process.env.DB_HOST ? process.env.DB_HOST : 'cluster0.qlqga.mongodb.net',
  user: process.env.DB_USER ? process.env.DB_USER : 'root',
  port: process.env.DB_PORT ? process.env.DB_PORT : '27017',
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_DATABASE ? '/' + process.env.DB_DATABASE : '',
};

let uri = '';
if (process.env.DB_TYPE === 'atlas'){
  uri = `mongodb+srv://${connOpts.user}:${connOpts.password}@${connOpts.host}${connOpts.database}`;
} else {
  // eslint-disable-next-line max-len
  uri = `mongodb://${connOpts.user}:${connOpts.password}@${connOpts.host}:${connOpts.port}${connOpts.database}`;
}

let options = {
  collectionName: 'alexa',
  mongoURI: uri,
  partitionKeyGenerator: (requestEnvelope) => {
    const userId = Alexa.getUserId(requestEnvelope);
    return userId.substr(userId.lastIndexOf('.') + 1);
  },
};

console.log('Connection to: ' + options.mongoURI);

let adapter = new MongoDBPersistenceAdapter(options);

/**
 * This handler acts as the entry point for your skill,
 * routing all request and response
 * payloads to the handlers above.
 * Make sure any new handlers or interceptors you've
 * defined are included below.
 * The order matters - they're processed top to bottom
 * */
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelloWorldIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler)
  .addErrorHandlers(
    ErrorHandler)
  .withPersistenceAdapter(adapter)
  .addRequestInterceptors(
    LocalisationRequestInterceptor)
  .create();

const app = express();
const expressAdapter = new ExpressAdapter(skill, false, false);
app.post('/', expressAdapter.getRequestHandlers());
app.listen(3000);
