/**
 * Module dependencies
 */

var fsx = require('fs-extra');
var assert = require('assert');
var _ = require('lodash');
var skipper = require('skipper');
var connect = require('connect');
var routify = require('routification');
var Temporary = require('temporary');
var crypto = require('crypto');
var request = require('request');






module.exports = Helpers();


function Helpers () {

  var fileFixtures;
  var outputDir;

  var server;
  var app;
  var PORT = 1337;

  return {

    /**
     * [setup description]
     * @return {[type]} [description]
     */
    setup: function (done) {

      // Build HTTP server and listen on a port.
      app = connect();
      app = routify(app);
      app.use(skipper());

      server = app.listen(PORT, done);

      // Expose globals for tests to use
      // (because we're too hog wild for that require shit + c'mon these are tests...)
      global['_'] = _;
      global['assert'] = assert;
      global['request'] = request;
      global['fsx'] = fsx;

      global['server'] = server;
      global['app'] = app;

      global['baseurl'] = 'http://localhost:'+PORT;


      // Create an array of file fixtures.
      fileFixtures = [];

      // Create a tmp directory for our uploads to live in.
      outputDir = new Temporary.Dir();

      // Write nonsense bytes to our file fixtures.
      for (var bytes=10; bytes < 100000; bytes*=10) {
        var EOF = '\x04';
        var f = new Temporary.File();
        f.writeFileSync(crypto.pseudoRandomBytes(bytes)+EOF);
        f.size = bytes;
        fileFixtures.push(f);
      }


      global['fixtures'] = {
        files: fileFixtures,
        dir: outputDir
      };
    },

    /**
     * [teardown description]
     * @return {[type]} [description]
     */
    teardown: function (done) {

      // Clean up fixtures.
      _.each(fileFixtures, function (f) {
        f.unlinkSync();
      });

      // Clean up directory w/ test output.
      fsx.removeSync(outputDir.path);

      // Teardown the HTTP server.
      server.close(done);
    }
  };
}




