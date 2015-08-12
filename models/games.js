var mongoose = require('mongoose');
var _ = require('lodash');
var util = require('util');

var schema = new mongoose.Schema({
  date: {type: Date, default: Date.now}
});

var Games = mongoose.model('games', schema);

module.exports = Games;
