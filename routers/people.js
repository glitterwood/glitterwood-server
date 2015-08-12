var express = require('express');
var router = express.Router();
var _ = require('lodash');
var People = require('./../models/people');

// note- as a security hedge, all methods require the game ID in addition to the person ID.

//@TODO: enforce security

router.delete('/:game/:id',
  function (req, res) {
    var game = req.params.game;
    var id = req.params.id;

    if (!id || !game) {
      return res.send({error: "no id and/or game", deleted: false});
    }
    People.collection.remove({_id: id, game: game}, function () {
      res.send({_id: id, game: game, deleted: true})
    });
  });

router.post('/:game/', function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
    data.game = req.params.game;
  }

  //@TODO: validate legit game
  // @TODO: validate character;

  new People(data).save(function (err, result) {
    if (err) {
      return res.status(400).send({error: 'bad data'});
    }
    res.send(result);
  })
});

router.get('/:game/:id', function (req, res) {
  var game = req.params.game;
  var id = req.params.id;

  if (!id || !game) {
    return res.send({error: "no id and/or game", deleted: false});
  }
  if (req.params.id){
    return People.findOne({_id: req.params.id}, function (err, person) {
      if (err) {
        return res.status(500).send({error: 'bad data'});
      }
      res.send(person);
    });
  }
});

router.get('/:game', function (req, res) {
  var game = req.params.game;

  if ( !game) {
    return res.send({error: "no game", deleted: false});
  }

    People.find({game: game}, function (err, people) {
    if (err) {
      return res.status(500).send({error: 'bad data'});
    }
    res.send(people);
  });
});

module.exports = router;
