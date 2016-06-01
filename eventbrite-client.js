'use strict';
var unirest = require('unirest');
var moment = require('moment');
var config = require('./config.js');

module.exports = class EventbriteClient{

  static getEvents(keyword, city){

    return new Promise((resolve, reject) => {
      unirest.get(`${config.eventbriteApiURL}/events/search`)
        .query({
          'token': config.eventbriteToken,
          'q': keyword,
          'venue.city': city
        })
        .end(response => {
          if (response.error){
            console.log(`Error: ${response.error}`);
          }
          resolve(this.structureOutput(response.body) );
        });
    });
  };

  static structureOutput(payload){
    let elems = [];
    for (let result of payload.events.slice(0, 5)){
      elems.push({
        title: result.name.text,
        subtitle: moment(result.start.local).format('lll'),
        item_url: result.url
      })
    }
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: elems
        }
      }
    }
  }
};