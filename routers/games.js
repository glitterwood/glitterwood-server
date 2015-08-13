var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Games = require('./../models/games');

router.delete('/:id',
  function (req, res) {
    var id = req.params.id;
    if (!id) {
      return res.send({error: "no id", deleted: false});
    }
    Games.collection.remove({_id: id}, function () {
      res.send({_id: id, deleted: true})
    });
  });

router.post('/', function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }

  if (!req.user){
    return res.status(400).send({error: 'user not logged in'});
  }

  data.creator = req.user.href;

  new Games(data).save(function (err, result) {
    if (err) {
      return res.status(400).send({error: 'bad data'});
    }
    res.send(result);
  })
});

router.get('/:id/people/:creator', function(req, res){
  var People = require('./../models/people');
  var id = req.params.id;
  var creator = req.params.creator;

  if (!id || !creator){
    res.status(400).send({error: 'missing id or creator'});
  } else {
    People.find({game: id, creator: creator}, function(err, people){
      if (err){
        res.status(400).send(err);
      } else {
        res.send(people);
      }
    });
  }

});

router.get('/:id', function (req, res) {
  if (req.params.id){
    return Games.findOne({_id: req.params.id}, function (err, game) {
      if (err) {
        return res.status(500).send({error: 'bad data'});
      }
      res.send(game);
    });
  }
  // else return all games

  console.log('getting all games!');
  Games.find({}, function (err, games) {
    if (err) {
      return res.status(500).send({error: 'bad data'});
    }
    console.log('games!: ', games);
    res.send(games);
  });
});

router.get('/', function (req, res) {
  var q = {};
  console.log('getting all games');
  if (req.query.creator){
    q.creator = req.query.creator;
  }
  Games.find(q, function (err, games) {
    if (err) {
      return res.status(500).send({error: 'bad data'});
    }
    console.log('games: ', games);
    res.send(games);
  });
});

module.exports = router;
