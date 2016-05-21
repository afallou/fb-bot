'use strict';
var User = require('./user.model').User;
var tree = require('./answer-tree.json');

module.exports = {
  tryHandleReply,
  handlePostback
};

function tryHandleReply(fbUserId, message){
  let uz;
  var query = User.getUser(fbUserId);
  return query.exec()
    .then(result => {
      if (!result){
        uz = new User({fbUserId});
        uz.save();
        return tree.messages.firstMessage;
      } else {
        uz = result;
        return tree.messages.helpChoice;
      }
    })
    .catch(err => {
      console.error(err);
    });
}


function handlePostback(payload){
  return tree.postbackReplies[payload];
}
