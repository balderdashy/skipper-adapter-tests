/**
 * Module dependencies
 */

var Lifecycle = require('./helpers/lifecycle');
var Uploader = require('./helpers/uploader');
var _ = require('lodash');
var util = require('util');
var path = require('path');
var assert = require('assert');
var toValidateTheHTTPResponse = require('./helpers/toValidateTheHTTPResponse');
var fsx = require('fs-extra');



describe('req.body ::', function() {
  var suite = Lifecycle();
  before(suite.setup);
  after(suite.teardown);


  // Object of params accessible in req.body in the upload action
  var bodyParamsThatWereAccessible = {};


  it('binds a file uploader action', function() {
    suite.app.post('/upload', function(req, res) {
      bodyParamsThatWereAccessible = _.cloneDeep(req.body);

      var OUTPUT_PATH = req.__FILE_PARSER_TESTS__OUTPUT_PATH__AVATAR;

      req.file('avatar')
        .upload(adapter.receive({
          id: OUTPUT_PATH
        }), function(err, files) {
          if (err) res.send(500, err);
          res.send(200);
        });
    });
  });



  it('sends a multi-part file upload request', function(done) {

    // Create a readable binary stream to upload
    var smallFile = suite.srcFiles[0];
    var pathToSmallFile = smallFile.path;
    var fileStreamToUpload = fsx.createReadStream(pathToSmallFile);

    // Builds an HTTP request
    var httpRequest = Uploader({
      baseurl: 'http://localhost:3000'
    }, toValidateTheHTTPResponse(done));

    // Attaches a multi-part form upload to the HTTP request.,
    var form = httpRequest.form();
    form.append('foo', 'hello');
    form.append('bar', 'there');
    form.append('avatar', fileStreamToUpload);

  });

  it('should have been able to access the body parameters passed in the upload request', function() {
    assert(bodyParamsThatWereAccessible);
    assert(bodyParamsThatWereAccessible.foo);
    assert(bodyParamsThatWereAccessible.bar);
  });


  it('should have uploaded a file to `suite.outputDir`', function(done) {

    // Check that a file landed
    adapter.ls(suite.outputDir.path, function (err, filesUploaded) {
      assert(!err);
      assert(filesUploaded.length === 1, 'a file should exist at '+suite.outputDir.path);

      // Check that its contents are correct
      adapter.read(path.join(suite.outputDir.path, filesUploaded[0]), function (err, uploadedFileContents) {
        assert(!err);
        var srcFileContents = fsx.readFileSync(suite.srcFiles[0].path);
        assert(uploadedFileContents.toString() === srcFileContents.toString());
        done();
      });
    });

  });

});
