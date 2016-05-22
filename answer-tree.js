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
      .then(result => {
        if (!result){
          uz = user.addUser(clientUserId);
          user.enterBranch(clientUserId, 'root');
          return tree.postbackReplies['root'][0].reply;
        } else {
          uz = result;

          this.updateQuery(uz, clientUserId, message);
          user.nextBranchStep(clientUserId);

          let replyType = tree.postbackReplies[uz.stateBranch][uz.branchStep + 1].type;
          if (replyType === 'end'){
            this.executeQuery(uz.stateBranch, uz.query, clientUserId);
            user.enterBranch(clientUserId, 'root');
          }
          return tree.postbackReplies[uz.stateBranch][uz.branchStep + 1].reply;
        }
      })
      .catch(err => {
        console.error(err);
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
    if (stateBranch === 'help.jobOffers'){
      Jobs.getJobs(query.role, query.location)
        .then(out => {
          this.bot.say({
            text: out,
            channel: clientUserId
          });
        });
    }
    else if (stateBranch === 'help.networking'){
      Events.getEvents(query.industry, query.location)
        .then(out => {
          this.bot.say({
            text: out,
            channel: clientUserId
          });
        });
    }
    user.enterBranch(clientUserId, 'root');
  }
};