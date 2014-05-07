/**
 * Module dependencies
 */

var fs = require('fs');
var path = require('path');
var Mocha = require('mocha');





/**
 * Run the generic tests using the Skipper adapter given by `opts.module`.
 * @param  {Object} opts
 */

module.exports = function runner (opts) {
  opts = opts || {};


  // Expose adapter as a global
  global['adapter'] = typeof opts.module === 'string' ? require(opts.module) : opts.module;

  // Instantiate adapter
  global['adapter'] = global['adapter']();

  var mocha = new Mocha({ bail: true });

  // Setup `before` and `after` lifecycle to keep them servers flowin'
  mocha.addFile(path.join('lib','lifecycle'));

  // Load the tests.
  fs.readdirSync(path.resolve(__dirname,'tests')).filter(function(filename) {
    return filename.match(/\.js$/);
  }).forEach(function(file) {
    mocha.addFile(
      path.join('tests', file)
    );
  });
  fs.readdirSync(path.resolve(__dirname,'tests/base')).filter(function(filename) {
    return filename.match(/\.js$/);
  }).forEach(function(file) {
    mocha.addFile(
      path.join('tests/base', file)
    );
  });

  // Now, run the tests.
  mocha.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });

};
