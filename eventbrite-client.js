'use strict';
var unirest = require('unirest');
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
          resolve(response.body.events[0].url);
        });
    });
  };
};