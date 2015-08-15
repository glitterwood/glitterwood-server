var expect = require('expect.js');
var _ = require('lodash');
var util = require('util');
var mongoose = require('mongoose');

try {
  mongoose.connect('mongodb://localhost/glitterwood-test');
} catch(err){
  console.log('mongoose already open');
}

var Cell = require('./../models/cells');

function _cellToObj(child) {
  var root = child.root.toHexString();
  var out = child.toJSON();
  out.parent = root;
  out.root = root;
  delete out._id;
  return out;
}


describe('Cell', function () {

  var root;

  beforeEach(function (done) {

    Cell.collection.remove({}, function () {
      done();
    });
  });

  beforeEach(function (done) {

    root = new Cell({i: 0, j: 0, depth: 0});

    root.save(done);
  });

  describe('#eachByDepth', function () {

    describe('single level sample', function () {

      beforeEach(function (done) {
        root.divide(4, done);
      });

      var cellCoordinates = [];

      beforeEach(function (done) {
        root.eachByDepth(function (cell, cb) {
          cellCoordinates.push(_.pick(cell, ['i', 'j']));
          cb();
        }, done);
      }, 20000);

      it('sampling cells at one level', function (done) {
        cellCoordinates = _.sortBy(cellCoordinates, function (c) {
          return c.i * 100 + c.j;
        });

        expect(cellCoordinates.length).to.be(17); // one for the root, 16 for each child
        expect(cellCoordinates).to.eql([{i: 0, j: 0},
            {i: 0, j: 0},
            {i: 0, j: 1},
            {i: 0, j: 2},
            {i: 0, j: 3},
            {i: 1, j: 0},
            {i: 1, j: 1},
            {i: 1, j: 2},
            {i: 1, j: 3},
            {i: 2, j: 0},
            {i: 2, j: 1},
            {i: 2, j: 2},
            {i: 2, j: 3},
            {i: 3, j: 0},
            {i: 3, j: 1},
            {i: 3, j: 2},
            {i: 3, j: 3}]
        );
        done();

      }, 20000);
    });

    describe('sampling cells at two levels', function () {

      var absCoordinates = [];

      beforeEach(function (done) {
        root.divide([4, 2], done);
      });

      beforeEach(function (done) {

        function finish(){
          setTimeout(done, 100);
        }

        root.eachByDepth(function(cell, cb){
          absCoordinates.push({ai: cell.absIoffset, aj: cell.absJoffset, depth: cell.depth, i: cell.i, j: cell.j});
          cb();
        }, finish);
      });

      it('should have a lot of coordinates', function(){
        absCoordinates = _.sortBy(absCoordinates, function(c){
          return 100000 * c.depth + c.ai * 1000 + c.aj;
        });

        expect(absCoordinates.length).to.be(1 + 4 * 4  + 4 * 4 * 2 * 2);
        expect(absCoordinates).to.eql(require('./../test_expectations/recurse2.json').coordinates);
      });

    });

  });

  describe('#divide', function () {

    describe('single division by 4', function () {

      beforeEach(function (done) {
        root.divide(4, done);
      });

      it('should have the expected children',
        function (done) {

          root.children(function (err, children) {

            var report = children.map(_cellToObj);

            var expectation = require('./../test_expectations/div_1.json').children;

            expectation.forEach(function (child) {
              child.root = root._id.toHexString();
              child.parent = root._id.toHexString();
              delete child._id;
            });

            for (var i = 0; i < report.length; ++i) {
              expect(report[i]).to.eql(expectation[i], 'mismatch of cell ' + i);
            }

            done();

          });
        });
    });

    describe('divide by 4 and 2', function () {

      beforeEach(function (done) {
        root.divide([4, 2], done);
      });

      it('should have the same children at the first level of depth as a simple divide by 4',
        function (done) {

          root.children(function (err, children) {

            var report = children.map(_cellToObj);

            var expectation = require('./../test_expectations/div_1.json').children;

            expectation.forEach(function (child) {
              child.root = root._id.toHexString();
              child.parent = root._id.toHexString();
              delete child._id;
            });

            for (var i = 0; i < report.length; ++i) {
              expect(report[i]).to.eql(expectation[i], 'mismatch of cell ' + i);
            }

            done();

          });
        });

      /**
       * note - since the children at depth have different parents,
       * we are tracking that each sector's parent number is sequential
       * as expected.
       */
      it('should have the expected depth', function (done) {

        root.getDepth(2, function (err, children) {

          var expectation = require('./../test_expectations/div_4_2_depth_2.json').children;

          var expectationParents = [];
          var reportParents = [];

          function expParentIndex(n, expectationParents) {
            var nString = n.toString();
            if (!_.contains(expectationParents, nString)) {
              expectationParents.push(nString);
            }
            return _.indexOf(expectationParents, nString);
          };

          expectation.forEach(function (child) {
            child.root = root._id.toHexString();
            child.parent = expParentIndex(child.parent, expectationParents);
            delete child._id;
          });

          function _depthChildrenReport(child) {
            var root = child.root.toHexString();
            var out = child.toJSON();
            out.parent = expParentIndex(out.parent, reportParents);
            out.root = root;
            delete out._id;
            return out;
          }

          var report = children.map(_depthChildrenReport);

          for (var i = 0; i < report.length; ++i) {
            expect(report[i]).to.eql(expectation[i], 'mismatch of cell ' + i);
          }

          done();

        });
      });
    });

  });

});
