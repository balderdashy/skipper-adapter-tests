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

  var mocha = new Mocha();

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

  // Now, run the tests.
  mocha.run(function(failures) {
    process.on('exit', function() {
      process.exit(failures);
    });
  });

};
