var express = require('express');
var router = express.Router();
var Players = require('./../models/players');
var multer = require('multer');
var util = require('util');
var _ = require('lodash');

// define the home page route
router.get('/', function (req, res) {
  Players.find({}, function (err, players) {
    if (err) {
      return res.status(400).send(err);
    }
    players = players.map(function (p) {
      var out = p.toJSON();
      if (p.avatar) {
        out.avatar = p.avatar.toString();
      }
      return out;
    });
    res.send(players);
  });
});
router.get('/:id', function (req, res) {
  Players.findOne({_id: req.params.id}, function (err, player) {
    if (err) {
      return res.status(400).send(err);
    }
    if (!player) {
      return res.status(404).send({errror: 'no player with id ' + req.query.id})
    }
    var out = player.toJSON();
    if (player.avatar) {
      out.avatar = player.avatar.toString();
    }
    res.send(player);
  });
});

router.delete('/:id?',
  function (req, res) {
    var id = req.params.id;
    if (id == 'all') {
      Players.collection.remove(function () {
        res.send({removed: 'all'});
      })
    } else {
      res.status(400).send({error: 'not done yet'});
    }
  });

router.post('/many', function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }
  console.log('data: ', data);

  if (!data.hasOwnProperty('names')) {
    return res.status(400).send({error: 'no names'});
  } else if (!_.isArray(data.names)) {
    return res.status(400).send({error: 'bad names - not an array'});
  }

  var names = data.names.slice(0);

  var players = [];

  function _makePlayer() {
    if (names.length) {
      var name = names.shift();
      console.log('making player', name);
      var player = new Players({name: name})
        .save(function (err, player) {
          console.log('saved', err, player);
          players.push(player);
          _makePlayer();
        });
    } else {
      res.send(players);
    }
  }
  _makePlayer();
});

router.post('/', multer().single('avatar-file'), function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }

  util.log(util.inspect(req));

  Players.find({name: data.name}, function (err, result) {
    if (err) {
      res.status(500).send(err);
    } else if (result.length) {
      res.status(409).send({error: 'name already exists', name: data.name});
    } else {
      new Players(data).save(function (err, newRecord) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send(newRecord);
        }
      });
    }
  });

});

module.exports = router;
