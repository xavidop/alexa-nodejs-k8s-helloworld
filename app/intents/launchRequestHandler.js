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
      const attrs = await attributesManager.getPersistentAttributes();

      console.log(JSON.stringify(attrs));

      const speakOutput = i18n.t('WELCOME_MSG');

      if (attrs.counter){
        attrs.counter += 1;
      } else {
        attrs.counter = 1;
      }

      attributesManager.setPersistentAttributes(attrs);

      await attributesManager.savePersistentAttributes();

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    },
  },
};

