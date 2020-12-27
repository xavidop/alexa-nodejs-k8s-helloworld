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

let options = {
  collectionName: 'alexa',
  mongoURI: 'mongodb+srv://root:root@cluster0.qlqga.mongodb.net',
  partitionKeyGenerator: (requestEnvelope) => {
    const userId = Alexa.getUserId(requestEnvelope);
    return userId.substr(userId.lastIndexOf('.') + 1);
  },
};

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
