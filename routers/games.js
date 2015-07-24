var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Games = require('./../models/games');
var Players = require('./../models/players');

var allocateGameResults = require('./../lib/allocateGameResults');

function _sanitizeTeam(teamList) {
  return _.reduce(teamList, function (out, team) {
    if (!/\(none\)/.test(team) && !_.contains(out, team)) {
      out.push(team);
    }
    return out;
  }, []);
}

router.delete('/all',
  function (req, res) {
    var id = req.params.id;
    Games.collection.remove(function () {
      Players.collection.remove(function () {
        res.send({result: 'its all gone'});
      })
    });
  });

router.post('/', function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }
  data.team1 = _sanitizeTeam(data.team1);
  data.team2 = _sanitizeTeam(data.team2);
  data.players = _.uniq(data.team1.concat(data.team2));

  new Games(data).save(function (err, result) {
    if (err) {
      return res.status(400).send({error: 'bad data'});
    }
    result.updatePlayerRanks();
    res.send(result);
  })
});

router.get('/', function (req, res) {
  Games.find({}, function (err, games) {
    if (err) {
      return res.status(500).send({error: 'bad data'});
    }
    res.send(games);
  });
});

router.get('/latest', function (req, res) {
  games.getLatest(function (err, game) {
      console.log('got the latest', game);
      if (err) {
        return res.status(500).send({error: err});
      }
      if (!game) {
        return res.status(404).send({error: 'no games'})
      }
      res.send(game);
    }
  );
});

router.post('/screwWithTime', function (req, res) {
  Games.screwWithTime(function () {
    res.send({timeScrewedWith: true});
  });
});

module.exports = router;
