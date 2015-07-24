var expect = require('expect.js');
var mongoose = require('mongoose');
var Players = require('./../models/players');
var Games = require('./../models/games');
var util = require('util');
var Elo = require('arpad');
var elo = new Elo();
var _ = require('lodash');

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

  it('#save', function () {
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

    it('should create a valid game', function (done) {
      Games.find({}, function (err, games) {
        expect(games.length).to.be(1);
        done();
      });
    });
  });

  describe('#updatePlayerRanks', function () {
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

    it('should update player ranks', function (done) {
      game.updatePlayerRanks(function () {
        Players.findOne({name: 'Alpha'}, function (err, alpha) {
          var newRank = elo.newRatingIfLost(1200, 1200);
          expect(alpha.games.length).to.be(1);
          expect(alpha.rank).to.be(newRank);

          Players.findOne({name: 'Beta'}, function (err, beta) {
            var newRank = elo.newRatingIfWon(1200, 1200);
            expect(beta.games.length).to.be(1);
            expect(beta.rank).to.be(newRank);
            done();
          })
        });
      });
    });

    it('should handle multiple players in teams', function (done) {
      var game = new Games({
        team1: ['Alpha', 'Gamma'],
        team2: ['Beta', 'Delta'],
        players: ['Alpha', 'Beta', 'Gamma', 'Delta'],
        winner: 2
      });

      game.save(function () {
        game.updatePlayerRanks(function () {
          Players.getName('Alpha', function (err, alpha) {
            var newRank = elo.newRatingIfLost(1200, 1200);
            expect(alpha.games.length).to.be(1);
            expect(alpha.rank).to.be(newRank);
            Players.getName('Gamma', function (err, gamma) {
              var newRank = elo.newRatingIfLost(1400, 1200);
              expect(gamma.games.length).to.be(1);
              expect(gamma.rank).to.be(newRank);
              done();
            })
          });
        });

      });
    });

  });

  describe.only('#screwWithTime', function () {
    beforeEach(function (done) {
      var date =  new Date('1/1/1900');
      var pastGame = new Games({
        team1: ['Alpha'],
        team2: ['Beta'],
        winner: 2,
        date: date
      });
      pastGame.save(function (err, pastGame) {

        pastGame.updatePlayerRanks(function () {

          var nowGame = new Games({
            team1: ['Alpha'],
            team2: ['Beta'],
            winner: 1
          });

          nowGame.save(function () {

            nowGame.updatePlayerRanks(function () {
              var futureGame = new Games({
                team1: ['Alpha'],
                team2: ['Beta'],
                date: new Date('1/1/2100'), // note - update unit tests before 2100
                winner: 1
              });

              futureGame.updatePlayerRanks(function () {
                futureGame.save(done);
              });
            });
          });
        });
      });
    });

    var alpha;

    beforeEach(function (done) {
      Players.getName('Alpha', function (err, p) {
        alpha = p;
        done();
      });
    });

    it('should have three games in Alpha', function () {
      expect(alpha.games.length).to.be(3);
    });

    it('should have games in the past present and future', function () {
      var gameDates = alpha.games.map(function (game) {
        return game.date.getTime();
      });

      var minDate = gameDates.reduce(function (out, value) {
        if (_.isNull(out)) {
          return value;
        }
        return Math.min(out, value);
      }, null);
      var maxDate = gameDates.reduce(function (out, value) {
        if (_.isNull(out)) {
          return value;
        }
        return Math.max(out, value);
      }, null);

      var now = new Date().getTime();

      expect(now).to.be.lessThan(maxDate);
      expect(now).to.be.greaterThan(minDate);
    });

    it('should shift all player game dates into the past', function (done) {
      Games.screwWithTime(function () {
        Players.find({}, function (err, players) {
          var minDate = null, maxDate = null;
          players.forEach(function (player) {

            minDate = player.games.reduce(function (out, game) {
              var value = game.date.getTime();
              if (_.isNull(out)) {
                return value;
              }
              return Math.min(out, value);
            }, minDate);

            maxDate = player.games.reduce(function (out, game) {
              var value = game.date.getTime();
              if (_.isNull(out)) {
                return value;
              }
              return Math.max(out, value);
            }, maxDate);
          });
          var now = new Date().getTime();
          expect(now).to.be.greaterThan(maxDate);
          expect(now).to.be.greaterThan(minDate);
          done();

        });
      });
    });

    it('should shift all game dates into the past', function (done) {
      Games.screwWithTime(function () {
        alpha = Players.getName('Alpha', function (err, alpha) {
          var gameDates = alpha.games.map(function (game) {
            return game.date.getTime();
          });

          var minDate = gameDates.reduce(function (out, value) {
            if (_.isNull(out)) {
              return value;
            }
            return Math.min(out, value);
          }, null);

          var maxDate = gameDates.reduce(function (out, value) {
            if (_.isNull(out)) {
              return value;
            }
            return Math.max(out, value);
          }, null);

          var now = new Date().getTime();
          expect(now).to.be.greaterThan(maxDate);
          expect(now).to.be.greaterThan(minDate);
          done();
        })
      });
    });
  });

});
