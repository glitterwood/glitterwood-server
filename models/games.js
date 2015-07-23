var mongoose = require('mongoose');
var schema = {
  date: {type: Date, default: Date.now},
  team1: ['string'],
  team2: ['string'],
  winner: 'number'
};

var Games = mongoose.model('games', schema);

module.exports = Games;
