var expect = require('expect.js');
var _ = require('lodash');
var util = require('util');

var Sparse2Darray = require('./../lib/sparse2Darray');

describe.only('Sparse2Darray', function () {
  var array2d;

  beforeEach(function () {
    array2d = new Sparse2Darray({outIndex: 'content'});
  });

  describe('#add', function () {

    it('accepts a single value', function () {

      array2d.add({absIoffset: 0.1, absJoffset: 0.5, content: 'bar'});

      expect(array2d.rowIndexes).to.eql([0, 0.1, 1]);
      expect(array2d.colIndexes).to.eql([0, 0.5, 1]);
    });

    it('accepts two values', function () {

      array2d.add({absIoffset: 0.1, absJoffset: 0.5, content: 'bar'});
      array2d.add({absIoffset: 0.2, absJoffset: 0.75, content: 'vey'});

      expect(array2d.rowIndexes).to.eql([0, 0.1, 0.2, 1]);
      expect(array2d.colIndexes).to.eql([0, 0.5, 0.75, 1]);
    });

    it('doesn\'t have redundant values', function () {

      array2d.add({absIoffset: 0.1, absJoffset: 0.5, content: 'bar'});
      array2d.add({absIoffset: 0.2, absJoffset: 0.75, content: 'vey'});
      array2d.add({absIoffset: 0.1, absJoffset: 0.75, content: 'bob'});

      expect(array2d.rowIndexes).to.eql([0, 0.1, 0.2, 1]);
      expect(array2d.colIndexes).to.eql([0, 0.5, 0.75, 1]);
    });

  });

  describe('#toArray', function () {

    it('can execute without added values', function () {
      expect(array2d.toArray()).to.eql([[null, null], [null, null]]);
    });

    it('reflects a single value', function () {
      array2d.add({absIoffset: 0.1, absJoffset: 0.5, content: 'bar'});
      expect(array2d.toArray()).to.eql([[null, null, null], [null, 'bar', null], [null, null, null]]);
    });

    it('reflects multiple values', function () {
      array2d.add({absIoffset: 0.1, absJoffset: 0.5, content: 'bar'});
      array2d.add({absIoffset: 0.2, absJoffset: 0.75, content: 'vey'});
      array2d.add({absIoffset: 0.1, absJoffset: 0.75, content: 'bob'});

      console.log('multi array', JSON.stringify(array2d.toArray(), true, 4));

      expect(array2d.toArray()).to.eql([
          [
            null, null, null, null
          ],
          [
            null, "bar", "bob", null
          ],
          [
            null, null, "vey", null
          ],
          [
            null, null, null, null
          ]
        ]
      )
    });

  });

});
