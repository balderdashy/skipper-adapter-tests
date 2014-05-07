describe('skipper usage', function() {

  it('should allow a file to be uploaded', function(done) {

    // Set up a route which listens to uploads
    app.post('/upload', function (req, res, next) {
      assert(_.isFunction(req.file));
      var foo = req.file('foo');
      return res.end();
    });

    var URL = baseurl+'/upload';

    // Build an HTTP request with an attached multipart form upload.
    var httpRequest =
    request.post(URL, function(err, response, body) {
      if (err) return done(err);
      else return done();
    });

    // var form = httpRequest.form();
    // form.append('foo', 'hello');
    // form.append('bar', 'there');
    // form.append('avatar', fsx.createReadStream( pathToFile ));

  });

});
