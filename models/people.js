var mongoose = require('mongoose');
var _ = require('lodash');
var util = require('util');

var schema = new mongoose.Schema({
  date: {type: Date, default: Date.now},
  game: {type: mongoose.Schema.Types.ObjectId, ref: 'games'},
  name: {type: 'string'},
  looks: 'number',
  smarts: 'number',
  energy: 'number',
  talent: 'number',
  friendly: 'number',
  age: 'number',
  gender: {type: 'string', enum: ['m', 'f', '?']},
  playable: {type: 'boolean', default: 'false'},
  creator: 'string'
});

schema.pre('save', function(next){
  if (this.gender != 'm'){
    this.gender = 'f';
  }
  this.age = Math.max(this.age, 10);
  this.age = Math.min(this.age, 80);
  next();
});

schema.isLegalPerson = function () {
  var sum = 0;
  var legal = true;
  ['looks', 'smarts', 'energy', 'talent', 'friendly'].forEach(function (label) {
    var value = this[label];
    if (value < 1 || value > 5) {
      legal = false;
    }
    sum += value;
  }, this);

  if (sum > 5 * (1 + 5) / 2) // the mean stat is averge of 1 and 5
  {
    return false;
  }

  return legal;
};

var Games = mongoose.model('people', schema);

module.exports = Games;
