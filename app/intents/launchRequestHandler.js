'use strict';

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');

module.exports = {
  LaunchRequestHandler: {
    canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

      // Test MongoDB connection works
      const { attributesManager } = handlerInput;
      await attributesManager.getPersistentAttributes();

      const speakOutput = i18n.t('WELCOME_MSG');

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    },
  },
};

