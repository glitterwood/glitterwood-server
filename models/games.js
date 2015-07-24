var mongoose = require('mongoose');
var _ = require('lodash');
var Elo = require('arpad');
var util = require('util');

var schema = new mongoose.Schema({
  date: {type: Date, default: Date.now},
  team1: ['string'],
  team2: ['string'],
  players: ['string'],
  winner: 'number'
});

schema.statics.getLatest = function (callback) {
  Games.findOne({}, null, {
    sort: {
      date: -1
    }
  }, callback);
};

function _cleanupLists(next) {
  this.team1 = _(this.team1).uniq().compact().value();
  this.team2 = _(this.team2).uniq().compact().value();

  this.players = _(this.team1.concat(this.team2)).uniq().compact().value();
  if (next) {
    next();
  }
}
schema.pre('save', _cleanupLists);

schema.statics.screwWithTime = function (done) {
  var tasks;

  function _endTask() {
    --tasks;
    if (tasks <= 0 && done) {
      done();
      done = null;
    }
  }

  Games.getLatest(function (err, latest) {
    if (err) {
      return done(err);
    }
    if (!latest) {
      console.log('no latest game');
      return done(null, 'no games exist to screw with');
    }

    var now = new Date();
    if (latest.date.getTime() < now.getTime()) {
      console.log('no future games');
      return done(null, 'no games exist in the future');
    }

    var shift = -(latest.date.getTime() - now.getTime());

    Games.find({}, function (err, games) {
      var Players = require('./players');
      Players.find({}, function (err, players) {
        tasks = games.length + players.length;

        games.forEach(function (game) {
          game.date = new Date(game.date.getTime() + shift);
          game.markModified('date');
          game.save(_endTask);
        });

        players.forEach(function (player) {
          player.games.forEach(function (game) {
            game.date = new Date(game.date.getTime() + shift);
          });
          player.markModified('games');
          player.save(_endTask)
        });
      });
    });
  });
};

schema.methods.getPlayers = function (callback) {
  var Players = require('./players');
  Players.find({name: {$in: this.players}}, callback);
};

schema.methods.updatePlayerRanks = function (done) {
  var game = this;
  this.save(function(){

  var tasks = 0;

  function _endTask() {
    --tasks;
    if (tasks <= 0 && done) {
      done();
      done = null;
    }
  }

  game.getPlayers(function (err, players) {
    players.forEach(function (player) {
      if (!player.rank || isNaN(player.rank)) {
        player.rank = 1200;
        player.save(); // hack for dev bugs
      }
    });

    var playersIndex = _playersByName(players);

    var nextEffects = [];
    var winners = _namesToPlayers(game['team' + game.winner], playersIndex);
    var losers = _namesToPlayers(game.winner === 1 ? game.team2 : game.team1, playersIndex);

    var bestWinnerScore = _bestScore(winners);
    var bestLoserScore = _bestScore(losers);

    winners.forEach(function (winner) {
      var rank = elo.newRatingIfWon(winner.rank, bestLoserScore);
      nextEffects.push(_gameUpdate(winner, game, rank, true));
    });

    losers.forEach(function (loser) {
      var rank = elo.newRatingIfLost(loser.rank, bestWinnerScore);
      nextEffects.push(_gameUpdate(loser, game, rank, false));
    });

    tasks = nextEffects.length;
    nextEffects.forEach(function (change) {
      change.player.updateRank(change, _endTask);
    });
  });
  }.bind(this));
};

function _namesToPlayers(nameStrings, index) {
  return nameStrings.map(function (name) {
    if (!index[name]) {
      throw new Error('no ' + name + ' in index ' + util.inspect(index));
    }
    return index[name];
  });
}

function _gameUpdate(player, game, rank, won) {
  return {
    player: player,
    newRank: rank,
    oldRank: player.rank,
    game: game.id,
    date: game.date,
    won: won
  };
}

var Games = mongoose.model('games', schema);

function _playersByName(players) {
  return _.reduce(players, function (out, player) {
    out[player.name] = player;
    return out;
  }, {});
}

function _bestScore(players) {
  if (players.length === 0) {
    return 0;
  }
  return _.reduce(players, function (bestScore, player) {
    if (!player) {
      console.log('bad players:', players);
      throw new Error('players has an empty record, ');
    }
    return Math.max(bestScore, player.rank);
  }, 0);
}

var elo = new Elo();

module.exports = Games;
