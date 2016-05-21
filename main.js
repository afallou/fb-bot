'use strict';
var http = require('http');
var Bot = require('messenger-bot');
var Handler = require('./handler');
var handler = new Handler();
var config = require('./config');
var answerTree = require('./answer-tree');

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoURI);

let bot = new Bot({
  token: config.fbPageToken,
  verify: 'VERIFY_TOKEN',
  secret: 'APP_SECRET'
});

var WitClient = require('./wit-client');
var wit = new WitClient(bot);

bot.on('error', (err) => {
  console.error(err.message)
});

bot.on('message', (payload, reply) => {
  console.log(`Got message ${payload.message.text}`);

  // We have a first rule-based layer handling some simple cases
  let treeReplyProm = answerTree.tryHandleReply(payload.sender.id, payload.message.text);
  treeReplyProm
    .then(treeReply => {
    if (treeReply){
      reply(treeReply, err => {
        if (err){
          console.error(err);
        }
      });
    } else {
      // The simple rules didn't give an answer >> second layer is using a conversational API
      wit.handleMessage(payload.message.text, parseInt(payload.sender.id));
    }
  })
    .catch(err => {
      console.error(err);
    });
});

bot.on('postback', (payload, reply) => {
  let postbackReply = answerTree.handlePostback(payload.postback.payload);

  reply(postbackReply, (err, info) => {});
});

http.createServer(bot.middleware()).listen(3000);
console.log('Echo bot server running at port 3000.');