var mongoose = require('mongoose');
var _ = require('lodash');
var util = require('util');

var schema = new mongoose.Schema({
  date: {type: Date, default: Date.now},
  creator: 'string'
});

schema.pre('save', function(next){
  if (this.creator){
    this.creator = this.creator.split('/').pop();
  }
  next();
});

var Games = mongoose.model('games', schema);

module.exports = Games;
