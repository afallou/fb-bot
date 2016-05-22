'use strict';
var http = require('http');
var Botkit = require('botkit');
var config = require('./config');
var AT = require('./answer-tree');
var WitClient = require('./wit-client');

var MongoClient = require('mongodb').MongoClient;
MongoClient.connect(config.mongoURI, (err, dbConn) => {
  if (err){
    console.error(`Error connecting to the database: ${err}`);
  } else {
    global.db = dbConn;
    console.log('Database connected');
  }
});

let controller = Botkit.facebookbot({
  debug: true,
  access_token: config.fbPageToken,
  verify_token: 'VERIFY_TOKEN'
});


controller.hears(['hello', 'hi'], 'message_received', (bot, message) => {
  bot.reply(message, 'Hi there');
});

controller.on('message_received', (bot, message) => {
  console.log(`Got message ${message.text}`);

  // We have a first rule-based layer handling some simple cases
  let treeReplyProm = answerTree.tryHandleReply(message.user, message.text);
  treeReplyProm
    .then(treeReply => {
    if (treeReply){
      bot.reply(message, treeReply, (err, resp) => {
        if (err){
          console.error(err);
        }
      });
    } else {
      // The simple rules didn't give an answer >> second layer is using a conversational API
      wit.handleMessage(message.text, parseInt(message.user));
    }
  })
    .catch(err => {
      console.error(err);
    });
});

controller.on('tick', (bot,message) => {
});

controller.on('facebook_postback', (bot, message) => {
  let postbackReply = answerTree.handlePostback(message.user, message.payload);

  bot.reply(message, postbackReply);
});

var bot = controller.spawn({
});

var wit = new WitClient(controller);
var answerTree = new AT(bot);

let port = process.env.port || 3000;
controller.setupWebserver(port, function(err, webserver) {
  controller.createWebhookEndpoints(webserver, bot, function() {
    console.log(`Echo bot server running at port ${port}`);
  });
});