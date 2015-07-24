var expect = require('expect.js');
var mongoose = require('mongoose');
var Players = require('./../models/players');
var Games = require('./../models/games');
var util = require('util');
var Elo = require('arpad');
var elo = new Elo();

mongoose.connect('mongodb://localhost/lumiata-test');

describe('games', function () {

  beforeEach(function (done) {
    Games.collection.remove({}, done);
  });

  beforeEach(function (done) {
    Players.collection.remove({}, done);
  });

  beforeEach(function (done) {
    new Players({name: 'Alpha'}).save(done);
  });

  beforeEach(function (done) {
    new Players({name: 'Beta'}).save(done);
  });

  beforeEach(function (done) {
    new Players({name: 'Gamma', rank: 1400}).save(done);
  });

  beforeEach(function (done) {
    new Players({name: 'Delta', rank: 1100}).save(done);
  });

  it('should save Alpha', function (done) {
    Players.find({name: 'Alpha'}, function (err, players) {
      expect(players[0].name).to.be('Alpha');
      done();
    })
  });
  var game;

  beforeEach(function (done) {
    game = new Games({
      team1: ['Alpha'],
      team2: ['Beta'],
      players: ['Alpha', 'Beta'],
      winner: 2
    });

    game.save(done);
  });

  it('#save', function(){
    it('should create a valid game', function (done) {
      Games.find({}, function (err, games) {
        expect(games.length).to.be(1);
        done();
      });
    });
  });

  describe('#updatePlayerRanks', function (done) {

    it('should update player ranks', function(){
      game.updatePlayerRanks();
      Players.findOne({name: 'Alpha'}, function(err, alpha){
        var newRank = elo.newRatingIfLost(1200, 1200);
        expect(alpha.games.length).to.be(1);
        expect(alpha.rank).to.be(newRank);
        Players.findOne({name: 'Beta'}, function(err, beta){
          var newRank = elo.newRatingIfWon(1200, 1200);
          expect(beta.games.length).to.be(1);
          expect(beta.rank).to.be(newRank);
        })
      });
    });

    it('should handle multiple players in teams', function(){
    var  game = new Games({
        team1: ['Alpha', 'Gamma'],
        team2: ['Beta', 'Delta'],
        players: ['Alpha', 'Beta', 'Gamma'],
        winner: 2
      });

      game.save(done);
      game.updatePlayerRanks();
      Players.findOne({name: 'Alpha'}, function(err, alpha){
        var newRank = elo.newRatingIfLost(1200, 1200);
        expect(alpha.games.length).to.be(1);
        expect(alpha.rank).to.be(newRank);
        Players.findOne({name: 'Gamma'}, function(err, gamma){
          var newRank = elo.newRatingIfWon(1400, 1200);
          expect(gamma.games.length).to.be(1);
          expect(gamma.rank).to.be(newRank);
        })
      });
    });

  });

});
