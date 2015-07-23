var mongoose = require('mongoose');

var schema = {
  name: {type: 'string', index: {unique: true}},
  rank: {type: 'number', defaultValue: 1200}
};

var Players = mongoose.model('players', schema);

module.exports = Players;
