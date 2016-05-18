'use strict';

const Wit = require('node-wit').Wit;
var config = require('./config.js');
var evbClient = require('./eventbrite-client.js');
var indeedClient = require('./indeed-client.js');
const uuid = require('node-uuid');

const token = config.witaiToken;

module.exports = class WitClient {

  constructor(fbBot){
    this.fbBot = fbBot;
    this.actions = this.buildActions();
    this.client = new Wit(token, this.actions);
    this.sessionId = uuid.v1();
    this.context = {};
  }

  handleMessage(msg, senderId){
    var steps = 3;
    this.client.runActions(
      senderId,
      msg,
      this.context,
      (error, context) => {
        if (error) {
          console.error(error);
        } else {
          this.context = context;
        }
      },
      steps
    )
  }

  firstEntityValue(entities, entity){
    const val = entities && entities[entity] &&
        Array.isArray(entities[entity]) &&
        entities[entity].length > 0 &&
        entities[entity][0].value
      ;
    if (!val) {
      return null;
    }
    return typeof val === 'object' ? val.value : val;
  };

  buildActions(){
    return {
      say: (sessionId, context, message, cb) => {
        let cback = (err, info) => {
          if (err){
            console.error(err);
          } else {
            cb();
          }
        };
        this.fbBot.sendMessage(sessionId, {text: message}, cback);
      },
      merge: (sessionId, context, entities, message, cb) => {
        // Retrieve the location entity and store it into a context field
        const loc = this.firstEntityValue(entities, 'location');
        const query = this.firstEntityValue(entities, 'search_query');
        const searchType = this.firstEntityValue(entities, 'search_type');
        if (loc) {
          context.location = loc;
        }
        if (query){
          context.keywords = query;
        }
        if (searchType){
          context.searchType = searchType;
        }
        cb(context);
      },
      error(sessionId, context, error) {
        console.log(error.stack);
      },
      ['getEvents'](sessionId, context, cb) {
        // Here should go the api call, e.g.:
        // context.forecast = apiCall(context.loc)
        if (context.searchType === 'events'){
          evbClient.getEvents(context.keywords, context.location)
            .then(url => {
              context.links = url;
            });
        } else if (context.searchType === 'jobs'){
          indeedClient.getJobs(context.keywords, context.location)
            .then(url => {
              context.links = url;
            });
        }
        cb(context);
      }
    };
  }
};
