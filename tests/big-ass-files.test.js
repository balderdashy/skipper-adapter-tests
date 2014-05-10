describe.only('when some big files start coming in, this adapter', function() {

  before(function () {
    // Set up a route which listens to uploads
    app.post('/upload', function (req, res, next) {
      assert(_.isFunction(req.file));
      req.file('avatar').upload(adapter.receive({
        maxBytes: 50000000 // 50 MB
      }), function (err, files) {
        if (err) throw err;
        res.statusCode = 200;
        return res.end();
      });
    });
  });

  it('should work properly with 2 simultaneous requests with decent-sized (1.5MB) files', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(2), toUploadAFile(1.5), done);
  });

  it('should work properly with 2 simultaneous, "well-endowed" (4MB) requests', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(2), toUploadAFile(4), done);
  });

  it('should work properly with 2 simultaneous requests with 10MB file attachments', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(2), toUploadAFile(10), done);
  });

  it('should work properly with 2 simultaneous requests with big ass (25MB) file attachments.', function(done) {
    this.slow(900000);// (15 minutes)
    require('async').each(_.range(2), toUploadAFile(25), done);
  });

});


/**
 * [toUploadAFile description]
 * @param  {Number} MB
 * @return {Function}
 */
function toUploadAFile (MB) {

  /**
   * A function which builds an HTTP request with attached multipart
   * form upload(s), checking that everything worked.
   */
  return function uploadFile(i, cb) {
    var httpRequest = request.post(baseurl+'/upload', onResponse);
    var form = httpRequest.form();
    form.append('foo', 'hello');
    form.append('bar', 'there');
    var nonsenseFileToUpload = GENERATE_NONSENSE_FILE(MB*1000000);
    form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));

    // Then check that it worked.
    function onResponse (err, response, body) {
      if (err) return cb(err);
      else if (response.statusCode > 300) return cb(body || response.statusCode);
      else cb();
    }
  };
}

