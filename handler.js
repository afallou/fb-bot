'use strict';

module.exports = class Handler{
  constructor(){}


  genericMessage() {
    return {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "First card",
            "subtitle": "Element #1 of an hscroll",
            "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
            "buttons": [{
              "type": "web_url",
              "url": "https://www.messenger.com/",
              "title": "Web url"
            }, {
              "type": "postback",
              "title": "Postback",
              "payload": "Payload for first element in a generic bubble"
            }]
          }, {
            "title": "Second card",
            "subtitle": "Element #2 of an hscroll",
            "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
            "buttons": [{
              "type": "postback",
              "title": "Postback",
              "payload": "Payload for second element in a generic bubble"
            }]
          }]
        }
      }
    }
  }

  handleMessage(payload){
    console.log(JSON.stringify(payload));
    let text = payload.message.text;
    let replyMsg;
    if (text === 'Generic'){
      replyMsg = this.genericMessage();
    }
    else {
      replyMsg = {text};
    }
    return replyMsg;
  }


  handlePostback(payload){
    console.log(`Got postback ${JSON.stringify(payload)}`);
  }
};