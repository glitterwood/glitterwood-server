var mongoose = require('mongoose');
var _ = require('lodash');
var util = require('util');

/**
 * This is designed to produce a grid that subdivides recursively such that all cells at all levels
 * have an absI/J offset from 0..1. In future versions, lateral expansion could produce a wider range of i/j values
 * Each generation at this point has the same absFraction, though it is not necessary for the math to work out.
 * It is required that the parent be present and fully computed for the children to propery generate its absolute
 * coordinates.
 *
 * As the only nesting in this data structure is the identity of the parent,
 * there is no technical limit on the number of times
 * that cells can be divided, though at some point the resolution
 * of the absolute fraction may be a problem.
 */

var schema = new mongoose.Schema({
  i: 'number', // the index (within the current peer set) ranging from 0 .. fraction - 1
  j: 'number', //  " " "
  localIoffset: 'number', // the absolute offset of this cell from its peerset's 0,0 cell
  localJoffset: 'number', // " "
  absIoffset: 'number', // the world offset of this cell
  absJoffset: 'number', // " "
  fraction: 'number', // the i/j count of this peer set.
  absFraction: 'number', // the denominator at the current scale
  parent: {type: mongoose.Schema.ObjectId, ref: 'cells'},
  root: {type: mongoose.Schema.ObjectId, ref: 'cells'},
  depth: 'number'
});

var Cells = mongoose.model('cells', schema);

schema.statics.divide = function (root, level, fraction, done) {
  done = _.once(done);
  var tasks = 0;

  this.collection.remove({root: root, level: {$gt: level}}, function () {
    var stream = cells.find({root: root, level: level}).stream();
//@TODO: listen for errors
    var doneReading = false;
    stream.on('data', function (parent) {
      ++tasks;
      parent.divide(fraction, function () {
        --tasks;
        if ((tasks <= 0) && doneReading) {
          done();
        }
      })
    }).on('close', function () {
      doneReading = true;
      if (tasks <= 0) {
        done();
      }
    });
  });
};

schema.methods.children = function (callback) {
  Cells.find({parent: this}).sort({i: 'asc', j: 'asc'}).exec(callback);
};

schema.methods.divide = function (fraction, done) {
  fraction = Math.floor(fraction);
  if (fraction < 2) {
    throw new Error('cannot divide by ' + fraction);
  }
  var remaining = fraction * fraction;
  done = _.once(done);

  for (var i = 0; i < fraction; ++i) {
    for (var j = 0; j < fraction; ++j) {
      var cell = new Cells({i: i, j: j, parent: this, fraction: fraction});
      cell.save(function () {
        if (--remaining <= 0) {
          done();
        }
      })
    }
  }
};

schema.pre('save', function (next) {
  if (this.parent) {
    this.absFraction = this.fraction * this.parent.fraction();
  } else {
    this.absFraction = this.fraction;
  }

  this.localIoffset = this.i / this.absFraction;
  this.localJoffset = this.j / this.absFraction;
  if (this.parent) {
    this.absIoffset = this.localIoffset + this.parent.absIoffset;
    this.absJoffset = this.localJoffset + this.parent.absJoffset;
    this.depth = this.parent.depth + 1;
    this.root = this.parent.root;
  } else {
    this.absIoffset = this.localIoffset;
    this.absJoffset = this.localJoffset;
    this.depth = 0;
    this.root = this;
  }
});

module.exports = Cells;
