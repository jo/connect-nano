'use strict';

var port = process.env.PORT || 8000;
var couchUrl = 'http://couch.example.com';

var nock = require('nock');
var request = require('request');
var connect = require('connect');

var nano = require('../lib/connect-nano.js');

var app = function(middleware, options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  options.url = 'http://127.0.0.1:' + port;

  var app = connect()
    .use(connect.cookieParser())
    .use(nano(couchUrl))
    .use(middleware)
    .listen(port, function() {
      request(options, function(err, resp, data) {
        app.close();
        done(err, resp, data);
      });
    });
};

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.nano = {
  'is function': function(test) {
    test.expect(1);
    test.equal(typeof nano, 'function', 'should be a function.');
    test.done();
  },
  'returns function': function(test) {
    test.expect(1);
    test.equal(typeof nano('asd'), 'function', 'should be a function.');
    test.done();
  },
  'exposes req.nano api': function(test) {
    test.expect(1);
    app(function(req, res) {
      test.equal(typeof req.nano, 'object', 'should be an object.');
      res.end();
    }, test.done);
  },
  'configure cookie if present': function(test) {
    test.expect(1);
    var cookie = 'AuthSession=asd';
    app(function(req, res) {
      test.equal(req.nano.config.cookie, cookie, 'nano config should include auth cookie.');
      res.end();
    }, {
      headers: {
        Cookie: cookie
      }
    }, test.done);
  },
  'send cookie back to client': function(test) {
    test.expect(1);
    var cookie = 'AuthSession=asd';
    nock(couchUrl)
      .get('/')
      .reply(200, {}, { 'Set-Cookie': cookie });
    app(function(req, res) {
      req.nano.request(function() {
        res.end();
      });
    }, function(err, resp) {
      test.equal(resp.headers['set-cookie'], cookie, 'cookie should be returned to client');
      test.done();
    });
  },
  'send cookie back to client when piping': function(test) {
    test.expect(1);
    var cookie = 'AuthSession=asd';
    nock(couchUrl)
      .get('/')
      .reply(200, {}, { 'Set-Cookie': cookie });
    app(function(req, res) {
      req.nano.request()
        .on('end', function() {
          res.end();
        })
        .pipe(require('fs').createWriteStream('tmp'));
    }, function(err, resp) {
      test.equal(resp.headers['set-cookie'], cookie, 'cookie should be returned to client');
      test.done();
    });
  },
  'send cookie back to client inside scope': function(test) {
    test.expect(1);
    var cookie = 'AuthSession=asd';
    nock(couchUrl)
      .get('/mydb/mydoc')
      .reply(200, {}, { 'Set-Cookie': cookie });
    app(function(req, res) {
      req.nano.scope('mydb').get('mydoc', function() {
        res.end();
      });
    }, function(err, resp) {
      test.equal(resp.headers['set-cookie'], cookie, 'cookie should be returned to client');
      test.done();
    });
  }
};
