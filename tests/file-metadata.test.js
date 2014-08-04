describe('after uploading a file using this adapter, Skipper', function() {

  before(function () {
    // Set up a route which listens to uploads
    app.post('/upload', function (req, res, next) {
      assert(_.isFunction(req.file));
      req.file('avatar').upload(adapter.receive(), function (err, _files) {
        if (err) return next(err);
        res.statusCode = 200;
        return res.json(_files);
      });
    });
  });

  it('should return an array of file metadata objects', function(done) {
    uploadFile(1, function (err, metadata) {
      if (err) return done(err);
      assert(_.isArray(metadata), 'expected metadata to be an array, but it is:'+require('util').inspect(metadata, false, null));
      done();
    });
  });

  describe('each file metadata object', function () {
    it('should contain the original filename', function (){

    });
    it('should contain the file descriptor (`fd`)', function (){});
    it('should contain the size', function (){});
    it('should contain the MIME type, if one was present', function (){});
  });

});




/**
 * A function which builds an HTTP request with attached multipart
 * form upload(s), checking that everything worked.
 */
function uploadFile(i, cb) {
  var httpRequest = request.post(baseurl+'/upload', onResponse);
  var form = httpRequest.form();
  form.append('foo', 'hello');
  form.append('bar', 'there');
  form.append('avatar', fsx.createReadStream( fixtures.files[0].path ));

  // Then check that it worked.
  function onResponse (err, response, body) {
    if (err) return cb(err);
    else if (response.statusCode >= 300) return cb(body || response.statusCode);
    else {
      if (_.isString(body)) {
        try { body = JSON.parse(body); } catch (e){}
      }
      cb(err, body);
    }
  }
}
