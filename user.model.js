'use strict';

var config = require('./config');


module.exports = {

  addUser: (facebookId, stateBranch, branchStep) => {
    return new Promise((resolve, reject) => {
      global.db.collection('users').insertOne({
        'fbUserId': facebookId,
        'stateBranch': stateBranch,
        'branchStep': branchStep
      }, (err, result) => {
        if (err){
          console.error(err);
          reject();
        } else {
          resolve(result);
        }
      });
    });
  },
  getUser: (facebookId) => {
    return new Promise((resolve, reject) => {
      global.db.collection('users').findOne({'fbUserId': facebookId}, (err, result) => {
        if (err){
          console.error(err);
          reject();
        } else {
          resolve(result);
        }
      });
    });
  },
  nextBranchStep: (facebookId) => {
    return new Promise((resolve, reject) => {
      global.db.collection('users').update({'fbUserId': facebookId}, {$inc: {'branchStep': 1}}, (err, result) => {
        if (err){
          console.error(err);
          reject();
        } else {
          resolve(result);
        }
      });
    });
  },
  enterBranch: (facebookId, branchName) => {
    return new Promise((resolve, reject) => {
      global.db.collection('users').update(
        {'fbUserId': facebookId},
        {$set: {'branchStep': 0, 'stateBranch': branchName}},
        (err, result) => {
        if (err){
          console.error(err);
          reject();
        } else {
          resolve(result);
        }
      });
    });
  },
  updateQuery: (facebookId, key, value) => {
    let setObj = {};
    setObj[`query.${key}`] = value;
    return new Promise((resolve, reject) => {
      global.db.collection('users').update({'fbUserId': facebookId}, {$set: setObj}, (err, result) => {
        if (err){
          console.error(err);
          reject();
        } else {
          resolve(result);
        }
      });
    });
  }
};

