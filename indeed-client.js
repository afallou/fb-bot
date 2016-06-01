'use strict';
var unirest = require('unirest');
var config = require('./config.js');

module.exports = class IndeedClient{

  static getJobs(keyword, city){

    var userAgentString = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3)
    AppleWebKit/537.36 (KHTML, like Gecko)
    Chrome/50.0.2661.94 Safari/537.36`;

    return new Promise((resolve, reject) => {
      unirest.get(`${config.indeedApiURL}/ads/apisearch`)
        .query({
          'q': keyword,
          'l': city,
          'co': 'us',
          'publisher': `${config.indeedPublisherId}`,
          'userip': '1.2.3.4',
          'useragent': userAgentString,
          'format': 'json',
          'v': 2
        })
        .end(response => {
          if (response.error){
            console.log(`Error: ${response.error}`);
          }
          // The body is a json string
          resolve(this.structureOutput(JSON.parse(response.body)));
        });
    });
  };

  static structureOutput(payload){
    let elems = [];
    for (let result of payload.results.slice(0, 5)){
      elems.push({
        title: result.jobtitle,
        subtitle: result.company,
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