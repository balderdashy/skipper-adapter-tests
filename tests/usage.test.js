describe('this adapter', function() {

  it('should allow a file to be uploaded', function(done) {

    // Set up a route which listens to uploads
    app.post('/upload', function (req, res, next) {
      assert(_.isFunction(req.file));
      req.file('avatar').upload(adapter.receive(), function (err, files) {
        if (err) throw err;
        return res.end();
      });
    });

    var URL = baseurl+'/upload';

    // Build an HTTP request with attached multipart form upload(s).
    var httpRequest = request.post(URL, onResponse);
    var form = httpRequest.form();
    form.append('foo', 'hello');
    form.append('bar', 'there');
    form.append('avatar', fsx.createReadStream( fixtures.files[0].path ));

    // Then check that it worked.
    function onResponse (err, response, body) {
      if (err) return done(err);
      else if (response.statusCode > 300) {
        return done(body || response.statusCode);
      }
      else {
        done();
      }
    }

  });

});
