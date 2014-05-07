/**
 * Module dependencies
 */

var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');
var skipper = require('skipper');
var connect = require('connect');



module.exports = Helpers();


function Helpers () {

  var server;
  var app;
  var PORT = 1337;

  return {

    /**
     * [setup description]
     * @return {[type]} [description]
     */
    setup: function (done) {

      app = connect().use(skipper());
      server = app.listen(PORT, done);

      // Expose globals for tests to use
      // (because we're too hog wild for that require shit + c'mon these are tests...)
      global['module'] = require('./module');
      global['_'] = require('lodash');
      global['assert'] = require('assert');
      global['request'] = require('request');

      global['server'] = server;
      global['app'] = app;
      global['baseurl'] = 'http://localhost:'+PORT+'/';
    },

    /**
     * [teardown description]
     * @return {[type]} [description]
     */
    teardown: function (done) {
      server.close(done);
    }
  };
}




