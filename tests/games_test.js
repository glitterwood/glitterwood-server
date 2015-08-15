var expect = require('expect.js');
var mongoose = require('mongoose');
var Games = require('./../models/games');
var _ = require('lodash');

try {
  mongoose.connect('mongodb://localhost/glitterwood-test');
} catch(err){
  console.log('mongoose already open');
}

describe('games', function (done) {

  beforeEach(function (done) {
    Games.collection.remove({}, done);
  });

  it('should be able to create a game', function(done){
    var date = new Date();

    var game = new Games({date: date, creator: 'foo'});
    game.save(function(err, newGame){
      expect(err).to.be(null);
      expect(newGame.date.getTime()).to.eql(date.getTime());
      expect(newGame.creator).to.eql('foo');
      done();
    });
  });

});
