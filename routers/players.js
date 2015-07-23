var express = require('express');
var router = express.Router();
var Players = require('./../models/players');

// define the home page route
router.get('/', function (req, res) {
  Players.find({}, function (err, players) {
    res.send(players);
  });
});

router.delete('/:id?',
  function (req, res) {
    var id = req.params.id;
    if (id == 'all'){
      Players.collection.remove(function(){
        res.send({removed: 'all'});
      })
    } else {
      res.status(400).send({error: 'not done yet'});
    }
  });

router.post('/', function (req, res) {
  var data = req.body;
  if (typeof data == 'string') {
    data = JSON.parse(data);
  }

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
  })
});

module.exports = router;
