'use strict';
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;
var config = require('./config');

var userSchema = new Schema({
  fbUserId: String
});

Object.assign(userSchema.statics, {
    getUser: function (facebookId){
      return this.findOne({'fbUserId': facebookId});
    }
  }
);

module.exports = {
  User: mongoose.model('User', userSchema)
};