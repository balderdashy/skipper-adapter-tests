describe.only('under a bit of load, skipper', function() {

  it('should work properly with 30 simultaneous requests', function(done) {

    // Set up a route which listens to uploads
    app.post('/upload', function (req, res, next) {
      assert(_.isFunction(req.file));
      req.file('avatar').upload(adapter.receive(), function (err, files) {
        if (err) throw err;
        return res.end();
      });
    });


    // Send a bunch of file upload requests
    require('async').each(_.range(30), function (i, next){
      uploadFile(next);
    }, function (err) {
      if (err) return done(err);
      else return done();
    });


    /**
     * A function which builds an HTTP request with attached multipart
     * form upload(s), checking that everything worked.
     */
    function uploadFile(cb) {
      var httpRequest = request.post(baseurl+'/upload', onResponse);
      var form = httpRequest.form();
      form.append('foo', 'hello');
      form.append('bar', 'there');
      form.append('avatar', fsx.createReadStream( fixtures.files[0].path ));

      // Then check that it worked.
      function onResponse (err, response, body) {
        if (err) return cb(err);
        else if (response.statusCode > 300) return cb(body || response.statusCode);
        else cb();
      }
    }

  });

});
