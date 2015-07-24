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

schema.methods.getPlayers = function (callback) {
  var Players = require('./players');
  Players.find({name: {$in: this.players}}, callback);
};

schema.methods.updatePlayerRanks = function () {
  var game = this;
  this.getPlayers(function (err, players) {

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

    console.log('game', game);
    console.log('winners: ', winners.map(function(p){
      return p.name;
    }));
    console.log('losers: ', losers.map(function(p){
      return p.name;
    }));
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

    nextEffects.forEach(function (change) {
      change.player.updateRank(change);
    });
  });
};

function _namesToPlayers(nameStrings, index) {
  return nameStrings.map(function (name) {
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
  return _.reduce(players, function (bestScore, player) {
    return Math.max(bestScore, player.rank);
  }, 0);
}

var elo = new Elo();

module.exports = Games;
