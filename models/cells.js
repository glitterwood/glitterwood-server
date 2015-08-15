var mongoose = require('mongoose');
var _ = require('lodash');
var util = require('util');
var async = require('async');

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
  depth: 'number',

  localHeight: 'number',
  absHeight: 'number'
});

schema.methods.children = function (callback) {
  Cells.find({parent: this}).sort({i: 'asc', j: 'asc'}).exec(callback);
};

schema.methods.getDepth = function (depth, callback) {
  Cells.find({root: this.root, depth: depth}).sort({localIoffset: 'asc', localJoffset: 'asc'}).exec(callback);
};
schema.methods.getDepthStream = function (depth) {
  return Cells.find({root: this.root, depth: depth}).sort({localIoffset: 'asc', localJoffset: 'asc'}).stream();
};

schema.methods.getCellsAtDepth = function (rootId, depth, callback) {
  Cells.findById(rootId, function (err, root) {
    root.getDepth(depth, callback);
  });
};

schema.methods.getCellsAtDepthStream = function (rootId, depth, callback) {
  Cells.findById(rootId, function (err, root) {
    callback(null,root.getDepthStream(depth));
  });
};

schema.methods.rumple = function (params, done) {
  if (!params.randomizer) {
    params.randomizer = function () {
      return Math.random();
    }
  }
  if (!params.depthScale) {
    params.depthScale = 1.5;
  }

  schema.methods.eachByDepth(function (cell, cb) {
    var rand = params.randomizer();
    if (rand > 0.75) {
      cell.localHeight = 1;
    } else if (rand < 0.25) {
      cell.localHeight = -1;
    } else {
      cell.localHeight = 0;
    }
    ;
    if (cell.depth === 0) {
      cell.absHeight = cell.localHeight;
    }
    cell.save(cb);
  }, function () {
    schema.methods.eachByDepth(function (cell, cb2) {
      if (cell.depth > 0) {
        cell.populate('parent');
        var localToAbs = cell.localHeight / Math.pow(params.depthScale, (cell.depth));
        cell.absHeight = cell.parent.absHeight + localToAbs;
        cell.save(cb2);
      } else {
        cb2();
      }
    }, done);
  });
};

/**
 * eachByDepth executes a function on this,
 * then once on each cell.
 * EachByDepth executes once at the depth of the current cells' children,
 * then when all children have been treated, recurses on each child. (@TODO: currently stops at children)
 *
 * note: there is no control over the order in which children execute,
 * only that higher levels execute before lower levels.
 *
 * @param fn {function} -- must take two arguments, {Cell} and {fn}(done/callback);
 * @param done {function}
 *
 * nothing is currently returned to the callback or from the function.
 */
schema.methods.eachByDepth = function (fn, done, recursed) {
  var self = this;

  if (!recursed && this.depth === 0) {
    // execute on target then redo.
    return fn(this, function () {
      self.eachByDepth(fn, done, true);
    });
  }

  Cells.count({parent: self}, function (err, count) {
    if (count < 1) {
      return done();
    }

    function doRecurse() {

      var childWorker = async.queue(function (cell, cb) {
        cell.eachByDepth(fn, cb);
      });

      Cells.find({parent: self})
        .stream()
        .on('data', function (child) {
          childWorker.push(child);
        })
        .on('error', function (err) {
          console.log('cell find error: ', err.message);
        })
        .on('close', function () {
          childWorker.drain = done;
        });
    }

    var worker = async.queue(fn, 10);
    Cells.find({parent: self}).stream()
      .on('data', function (cell) {
        worker.push(cell);
      })
      .on('error', function (err) {
        console.log('cell find 1 error: ', err.message);
      })
      .on('close', function () {
        // second tier of execution. Though we could recurse inside the first loop,
        // this separation assures that all parents are finished before children iterate.
        worker.drain = doRecurse;
      });
  }); // end count
};

schema.methods.divide = function (fraction, done) {
  var subFraction;

  if (_.isArray(fraction)) {
    if (fraction.length > 1) {
      subFraction = fraction.slice(1);
      fraction = fraction[0];
    } else if (fraction.length < 1) {
      return done();
    }
  }

  fraction = Math.floor(fraction);
  if (fraction < 2) {
    return done(new Error('cannot divide by ' + fraction));
  }

  var remaining = fraction * fraction;
  var finished = false;

  function finish() {
    if (!finished) {
      finished = true;
      done();
    }
  }

  for (var i = 0; i < fraction; ++i) {
    for (var j = 0; j < fraction; ++j) {
      var cell = new Cells({i: i, j: j, depth: this.depth + 1, parent: this, fraction: fraction});
      cell.save(function (err, result) {
        if (subFraction) {
          result.divide(subFraction, function () {
            if (--remaining <= 0) {
              finish();
            }
          });
        } else {
          if (--remaining <= 0) {
            finish();
          }
        }
      })
    }
  }
};

schema.pre('save', function (next) {
  if (this.parent) {
    this.absFraction = this.fraction * this.parent.fraction;
  } else {
    this.fraction = 1;
    this.absFraction = this.fraction;
    this.depth = 0;
  }

  this.localIoffset = this.i / this.absFraction;
  this.localJoffset = this.j / this.absFraction;
  if (this.parent) {
    this.populate('parent');

    this.absIoffset = this.localIoffset + this.parent.absIoffset;
    this.absJoffset = this.localJoffset + this.parent.absJoffset;
    this.depth = this.parent.depth + 1;
    this.root = this.parent.root;
  } else {
    this.absIoffset = this.i;
    this.absJoffset = this.j;
    this.depth = 0;
    this.root = this._id;
  }

  next();
});

var Cells = mongoose.model('cells', schema);

module.exports = Cells;
