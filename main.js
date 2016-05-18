'use strict';
var http = require('http');
var Bot = require('messenger-bot');
var Handler = require('./handler');
var handler = new Handler();
var config = require('./config');

let bot = new Bot({
  token: config.fbPageToken,
  verify: 'VERIFY_TOKEN',
  secret: 'APP_SECRET'
});

var WitClient = require('./wit-client');
var wc = new WitClient(bot);

bot.on('error', (err) => {
  console.log(err.message)
});

bot.on('message', (payload, reply) => {
  console.log(`Got message ${payload.message.text}`);
  wc.handleMessage(payload.message.text, parseInt(payload.sender.id));

  //reply({text: payload.message.text}, (err) => {
  //  if (err){
  //    throw err;
  //  }
  //});
});

bot.on('postback', (payload, reply) => {
  handler.handlePostback(payload);

  reply({text: 'Cool!'}, (err, info) => {});
});

http.createServer(bot.middleware()).listen(3000);
console.log('Echo bot server running at port 3000.');