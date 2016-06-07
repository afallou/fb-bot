'use strict';
var http = require('http');
var Botkit = require('botkit');
var Rx = require('rx');

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

var onBot = Rx.Observable.fromCallback(controller.on, controller);

var messageSource = onBot('message_received')
  .flatMap(incoming => {
    let bot = incoming[0];
    let message = incoming[1];
    let reply = Rx.Observable.fromPromise(answerTree.tryHandleReply(message.user, message.text));
    return Rx.Observable.zip(Rx.Observable.from([bot]), reply, Rx.Observable.from([message]));
  })
  .do(replyArr => {
    // We get an array of objects in the same order as in the above observable: [bot, reply, message]
    replyArr[0].reply(replyArr[2], replyArr[1], (err, resp) => {
      if (err){
        console.error(err);
      }
    });
  });

messageSource.subscribe();

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

let port = process.env.PORT || 3000;
controller.setupWebserver(port, function(err, webserver) {
  controller.createWebhookEndpoints(webserver, bot, function() {
    console.log(`Echo bot server running at port ${port}`);
  });
});