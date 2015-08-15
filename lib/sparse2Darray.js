var _ = require('lodash');
var util = require('util');
function Sparse2Darray(params) {

  this.values = [];
  this.rowIndexes = [0, 1];
  this.colIndexes = [0, 1];
  this.xIndex = params.xIndex || 'absIoffset';
  this.yIndex = params.yIndex || 'absJoffset';
  this.outIndex = params.outIndex || 'content';
}

Sparse2Darray.prototype = {

  add: function (value) {
    if (!value.hasOwnProperty(this.xIndex)) {
      console.log('bad value ', util.inspect(value));
      throw new Error('value missing key ' + this.xIndex);
    }
    if (!value.hasOwnProperty(this.yIndex)) {
      console.log('bad value ', util.inspect(value));
      throw new Error('value missing key ' + this.yIndex);
    }
    this._index(value[this.xIndex], this.rowIndexes);
    this._index(value[this.yIndex], this.colIndexes);
    this.values.push(value);
  },

  _index: function (i, keys) {
    var k = _.sortedIndex(keys, i);

    if (keys[k] > i) {
      keys.splice(k, 0, i);
    }
  },

  toArray: function () {
    var out = this.rowIndexes.map(function () {
      return this.colIndexes.map(function () {
        return null;
      }, this)
    }, this);

    return _.reduce(this.values, function (out, value) {
      var i = _.indexOf(this.rowIndexes, value[this.xIndex], 0, true);
      var j = _.indexOf(this.colIndexes, value[this.yIndex], 0, true);
      out[i][j] = value[this.outIndex];
      return out;
    }, out, this);
  }

};

module.exports = Sparse2Darray;
