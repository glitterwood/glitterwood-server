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

  new Games(data).save(function (err, result) {
    if (err) {
      return res.status(400).send({error: 'bad data'});
    }
    res.send(result);
  })
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
  console.log('getting all games');
  Games.find({}, function (err, games) {
    if (err) {
      return res.status(500).send({error: 'bad data'});
    }
    console.log('games: ', games);
    res.send(games);
  });
});

module.exports = router;
