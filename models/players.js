var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  name: {type: 'string', index: {unique: true}},
  rank: {type: 'number', default: 1200},
  avatar: {type: 'buffer'},
  games: [
    {
      game: mongoose.Schema.Types.ObjectId,
      oldRank: 'number',
      newRank: 'number',
      date: {type: Date, default: Date.now},
      won: 'boolean'
    }
  ]
});

schema.methods.updateRank = function (change, done) {
  this.games.push(change);
  this.rank = change.newRank;
  this.markModified('games');
  this.save(done);
};

schema.statics.getName = function(name, callback){
  Players.findOne({name: name}, callback);
};

schema.methods.clearHistory = function (done) {
  this.games = [];
  this.rank = 1200;
  this.markModified('games');
  this.save(done);
};

schema.post('save', function(next){
  //console.log('player', this.name, 'has ', this.games.length, 'games');
});

var Players = mongoose.model('players', schema);

module.exports = Players;
