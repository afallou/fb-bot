'use strict';
var user = require('./user.model');
var tree = require('./answer-tree.json');

var Jobs = require('./indeed-client.js');
var Events = require('./eventbrite-client.js');


module.exports = class AnswerTree {

  constructor(bot){
    this.bot = bot;
  }

  tryHandleReply(clientUserId, message){
    let uz;
    return user.getUser(clientUserId)
      .then(uz => {
        if (!uz){
          user.addUser(clientUserId);
          return tree.postbackReplies['root'][0].reply;
        } else {
          if (uz.stateBranch === 'help.jobOffers' ||  uz.stateBranch === 'help.networking') {
            this.updateQuery(uz, clientUserId, message);

            let replyType = tree.postbackReplies[uz.stateBranch][uz.branchStep + 1].type;
            if (replyType === 'end') {
              this.executeQuery(uz.stateBranch, uz.query, clientUserId);
              user.enterBranch(clientUserId, 'root');
            }
          }
          user.nextBranchStep(clientUserId);
          if (uz.stateBranch === 'help.other' && tree.postbackReplies[uz.stateBranch][uz.branchStep + 1].type === 'end'){
            this.startOver(clientUserId);
          }
          return tree.postbackReplies[uz.stateBranch][uz.branchStep + 1].reply;
        }
      })
      .catch(err => {
        console.error(err.stack);
      });
  }


  handlePostback(clientUserId, payload){
    user.enterBranch(clientUserId, payload);
    return tree.postbackReplies[payload][0].reply;
  }

  /**
   * The user sent a message that a reply to a question on part of their query (location, industry etc...)
   * We update the corresponding query element in the database
   * @param {object} userObject - User object from database
   * @param {string} clientUserId - Id of user for chat client
   * @param {string} replyText - Content of user's reply
   */
  updateQuery(userObject, clientUserId, replyText){
    let messageType = tree.postbackReplies[userObject.stateBranch][userObject.branchStep].type;

    if (messageType === 'location' || 'industry' || 'role'){
      // Update in-memory object to keep it consistent with DB
      if (!userObject.query){
        userObject.query = {};
      }
      userObject.query[messageType] = replyText;
      user.updateQuery(clientUserId, messageType, replyText);
    }
  }

  executeQuery(stateBranch, query, clientUserId){
    var prom;
    if (stateBranch === 'help.jobOffers'){
      prom = Jobs.getJobs(query.role, query.location)
        .then(out => {
          this.bot.say({
            text: out,
            channel: clientUserId
          });
        });
    }
    else if (stateBranch === 'help.networking'){
     prom =  Events.getEvents(query.industry, query.location)
        .then(out => {
          this.bot.say({
            text: out,
            channel: clientUserId
          });
        });
    }

    prom
      .then(() => {
        this.startOver(clientUserId);
      });
  }


  startOver(clientUserId){
    user.enterBranch(clientUserId, 'root');
    setTimeout(() => {
      var replyObj = {channel: clientUserId};
      Object.assign(replyObj, tree.postbackReplies['startOver'][0].reply);
      this.bot.say(replyObj);
    }, 3000);
  }
};