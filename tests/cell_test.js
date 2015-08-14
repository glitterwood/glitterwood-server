var expect = require('expect.js');
var Cell = require('./../lib/cell');
var _ = require('lodash');
var util = require('util');

describe('Cell', function () {

  var root;

  beforeEach(function () {
    root = new Cell();

    root.divide(4);

  });

  it('should have proper offsets and indexes', function () {

    console.log(util.inspect(root.toJson(),
      {depth: 8}));

    expect(root.toJson()).to.eql(
      {
        i: 0, j: 0, fraction: 1, offset: {i: 0, j: 0}, children: [

        {
          i: 0, j: 0, fraction: 4, offset: {i: 0, j: 0}, children: []
        },
        {
          i: 0, j: 1, fraction: 4, offset: {i: 0, j: 0.25}, children: []
        },
        {
          i: 0, j: 2, fraction: 4, offset: {i: 0, j: 0.5}, children: []
        },
        {
          i: 0, j: 3, fraction: 4, offset: {i: 0, j: 0.75}, children: []
        },
        {
          i: 1, j: 0, fraction: 4, offset: {i: 0.25, j: 0}, children: []
        },
        {
          i: 1, j: 1, fraction: 4, offset: {i: 0.25, j: 0.25}, children: []
        },
        {
          i: 1, j: 2, fraction: 4, offset: {i: 0.25, j: 0.5}, children: []
        },
        {
          i: 1, j: 3, fraction: 4, offset: {i: 0.25, j: 0.75}, children: []
        },
        {
          i: 2, j: 0, fraction: 4, offset: {i: 0.5, j: 0}, children: []
        },
        {
          i: 2, j: 1, fraction: 4, offset: {i: 0.5, j: 0.25}, children: []
        },
        {
          i: 2, j: 2, fraction: 4, offset: {i: 0.5, j: 0.5}, children: []
        },
        {
          i: 2, j: 3, fraction: 4, offset: {i: 0.5, j: 0.75}, children: []
        },
        {
          i: 3, j: 0, fraction: 4, offset: {i: 0.75, j: 0}, children: []
        },
        {
          i: 3, j: 1, fraction: 4, offset: {i: 0.75, j: 0.25}, children: []
        },
        {
          i: 3, j: 2, fraction: 4, offset: {i: 0.75, j: 0.5}, children: []
        },
        {
          i: 3, j: 3, fraction: 4, offset: {i: 0.75, j: 0.75}, children: []
        }]
      }
    );

  });

});
