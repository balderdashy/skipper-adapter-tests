describe('when using the "maxBytes" option', function() {

  before(function () {
    // Set up a route which listens to uploads
    app.post('/uploadmax', function (req, res, next) {
      assert(_.isFunction(req.file));

      // Disable underlying socket timeout
      // THIS IS IMPORTANT
      // see https://github.com/joyent/node/issues/4704#issuecomment-42763313
      res.setTimeout(0);

      req.file('avatar').upload(adapter.receive({
        maxBytes: 2000000 // 2 MB
      }), function (err, files) {
        if (err) {
          return setTimeout(function() {
            res.statusCode = 500;
            return res.send(err.code);
          },100);
        }
        res.statusCode = 200;
        return res.end();
      });
    });
  });

  describe('Uploading a single file', function() {

    it('should allow uploads <= the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      toUploadAFile(1)(0, function(err) {
        return done(err);
      });
    });

    it('should not allow uploads > the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      toUploadAFile(3)(0, function(err) {
        if (err) {
          if (err == 'E_EXCEEDS_UPLOAD_LIMIT') {return done();}
          return done(err);
        }
        return done("Should have thrown an error!");
      });
    });

  });

  describe('Uploading multiple files in a single upstream', function() {

    it('should allow uploads <= the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      var httpRequest = request.post({
        url: baseurl+'/uploadmax'
      }, onResponse);
      var form = httpRequest.form();
      form.append('foo', 'hello');
      form.append('bar', 'there');
      var nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(100000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      // Then check that it worked.
      function onResponse (err, response, body) {
        if (err) return done(err);
        else if (response.statusCode > 300) return done(body || response.statusCode);
        else done();
      }

    });

    it('should not allow uploads > the maxBytes value', function(done) {
      this.slow(900000);// (15 minutes)
      var httpRequest = request.post({
        url: baseurl+'/uploadmax'
      }, onResponse);
      var form = httpRequest.form();
      form.append('foo', 'hello');
      form.append('bar', 'there');
      var nonsenseFileToUpload = GENERATE_NONSENSE_FILE(500000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(500000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(500000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(500000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      nonsenseFileToUpload = GENERATE_NONSENSE_FILE(500000);
      form.append('avatar', fsx.createReadStream( nonsenseFileToUpload.path ));
      // Then check that it worked.
      function onResponse (err, response, body) {
        if (body == 'E_EXCEEDS_UPLOAD_LIMIT' && response.statusCode == 500) {return done();}
        return done("Should have thrown an error!");
      }

    });

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
    var httpRequest = request.post({
      url: baseurl+'/uploadmax'
    }, onResponse);
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

