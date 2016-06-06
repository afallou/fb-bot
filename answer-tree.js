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
          return tree.branches['root'][0].reply;
        } else {
          if (uz.stateBranch === 'help.jobOffers' ||  uz.stateBranch === 'help.networking') {
            this.updateQuery(uz, clientUserId, message);

            let replyType = tree.branches[uz.stateBranch][uz.branchStep + 1].type;
            if (replyType === 'end') {
              this.executeQuery(uz.stateBranch, uz.query, clientUserId)
                .then(() => {
                  this.startOver(clientUserId);
                });
              user.enterBranch(clientUserId, 'root');
            }
          }
          if (uz.stateBranch === 'help.other' && tree.branches[uz.stateBranch][uz.branchStep + 1].type === 'end'){
            this.startOver(clientUserId);
          }
          if (tree.branches[uz.stateBranch][uz.branchStep + 1]){
            user.nextBranchStep(clientUserId);
            return tree.branches[uz.stateBranch][uz.branchStep + 1].reply;
          } else {
            //  We got ourselves into an unplanned step - start over.
            user.enterBranch(clientUserId, 'root');
            return tree.branches['root'][0].reply;
          }
        }
      })
      .catch(err => {
        console.error(err.stack);
      });
  }


  /**
   * A postback means we're entering a new branch of the tree
   * @param {string} clientUserId
   * @param {string} payload
   * @returns {*|Array}
   */
  handlePostback(clientUserId, payload){
    user.enterBranch(clientUserId, payload);
    return tree.branches[payload][0].reply;
  }

  /**
   * The user sent a message that is a reply to a question on part of their query (location, industry etc...)
   * We update the corresponding query element in the database
   * @param {object} userObject - User object from database
   * @param {string} clientUserId - Id of user for chat client
   * @param {string} replyText - Content of user's reply
   */
  updateQuery(userObject, clientUserId, replyText){
    let messageType = tree.branches[userObject.stateBranch][userObject.branchStep].type;

    if (messageType === 'location' || 'industry' || 'role'){
      // Update object to keep it consistent with DB
      if (!userObject.query){
        userObject.query = {};
      }
      userObject.query[messageType] = replyText;
      user.updateQuery(clientUserId, messageType, replyText);
    }
  }

  /**
   * Once we got all the info we need to find the data the user is looking for,
   * we actually get the data
   * @param {string} stateBranch - Which branch the user is on (i.e. what kind of query)
   * @param {object} query - Object containing the correct element (a subset of industry, role, location)
   * @param {string} clientUserId
   */
  executeQuery(stateBranch, query, clientUserId){
    var prom;
    if (stateBranch === 'help.jobOffers'){
      prom = Jobs.getJobs(query.role, query.location)
        .then(out => {
          if (out){
            Object.assign(out, {channel: clientUserId, text: ''});
            this.bot.say(out);
          } else {
            let reply = tree.branches['noResult'][0].reply;
            Object.assign(reply, {channel: clientUserId});
            this.bot.say(reply);
          }
        });
    }
    else if (stateBranch === 'help.networking'){
      prom =  Events.getEvents(query.industry, query.location)
        .then(out => {
          if (out) {
            Object.assign(out, {channel: clientUserId, text: ''});
            this.bot.say(out);
          } else {
            let reply = tree.branches['noResult'][0].reply;
            Object.assign(reply, {channel: clientUserId});
            this.bot.say(reply);
          }
        });
      }
    return prom
  }

  /**
   * Start again: ask the user if they need something else
   * @param {string} clientUserId
   */
  startOver(clientUserId){
    user.enterBranch(clientUserId, 'root');
    setTimeout(() => {
      var replyObj = {channel: clientUserId};
      Object.assign(replyObj, tree.branches['startOver'][0].reply);
      this.bot.say(replyObj);
    }, 3000);
  }
};