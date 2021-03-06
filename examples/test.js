'use strict';

var assert = require('assert');
var request = require('supertest');

var data = require('./data');
var app = request(require('./app'));
var db = require('./db');

describe('Example App', function() {
  before(function(done) {
    if (db.db) { return done(); }
    db.once('ready', done);
  });

  before(function(done) {
    db.db.dropDatabase(done);
  });

  before(function(done) {
    db.db.collection('places').createIndex({geojson: '2dsphere'}, done);
  });

  before(function(done) {
    db.db.collection('places').insertMany(data, done);
  });

  var url = '/api/places';

  it('returns all them places', function(done) {
    app.get(url)
      .expect(200)
      .expect(function(res) {
        assert.equal(res.body.length, 3);
      })
      .end(done);
  });

  it('returns places matching name', function(done) {
    app.get(url + '?name=Vatnane')
      .expect(200)
      .expect(function(res) {
        assert.equal(res.body.length, 1);
        assert.equal(res.body[0].name, 'Vatnane');
      })
      .end(done);
  });

  it('returns places near point', function(done) {
    app.get(url + '?near=6.13037,61.00607')
      .expect(200)
      .expect(function(res) {
        assert.equal(res.body.length, 3);
        assert.equal(res.body[0].name, 'Solrenningen');
        assert.equal(res.body[1].name, 'Åsedalen');
        assert.equal(res.body[2].name, 'Norddalshytten');
      })
      .end(done);
  });

  it('returns places inside bbox', function(done) {
    var bbox = [
      '5.5419158935546875',
      '60.92859723298985',
      '6.0363006591796875',
      '61.018719220334525'
    ].join(',');

    app.get(url + '?bbox=' + bbox)
      .expect(200)
      .expect(function(res) {
        assert.equal(res.body.length, 2);
        assert.equal(res.body[0].name, 'Norddalshytten');
        assert.equal(res.body[1].name, 'Vardadalsbu');
      })
      .end(done);
  });

  it('returns palces with any of the following tags', function(done) {
    app.get(url + '?tags[]=Båt&tags[]=Stekeovn')
      .expect(200)
      .expect(function(res) {
        assert.equal(res.body.length, 3);
        assert.equal(res.body[0].name, 'Solrenningen');
        assert.equal(res.body[1].name, 'Åsedalen');
        assert.equal(res.body[2].name, 'Selhamar');
      })
      .end(done);
  });
});
