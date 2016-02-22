var _ = require('lodash');
describe('aborting a file in progress', function() {
  this.timeout(1000);
  before(function () {
    // Set up a route which listens to uploads
    app.post('/upload_abort', function (req, res, next) {
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
            res.send(err.message);
            return res.end();
          },100);
        }
        res.statusCode = 200;
        return res.json(files);
      });
    });
  });

  it('should not crash the server', function(done) {
    var http = require('http');

    // Create the body in pieces.  We could just do a bunch of req.write() calls,
    // but doing it this way lets us keep track of the content size so if we change
    // the intended body, we don't have to recalculate the size manually.
    var body = [
      '--myawesomemultipartboundary\r\n',
      'Content-Disposition: form-data; name="avatar"; filename="somefiletokeep.jpg"\r\n',
      'Content-Type: image/jpeg\r\n',
      'Content-Transfer-Encoding: binary\r\n',
      '\r\n',
      new Buffer([66,66,66,66,66]),
      '\r\n--myawesomemultipartboundary\r\n',
      'Content-Disposition: form-data; name="avatar"; filename="somefiletobeaborted.jpg"\r\n',
      'Content-Type: image/jpeg\r\n',
      'Content-Transfer-Encoding: binary\r\n',
      '\r\n',
      new Buffer([65,65,65,65,65]),
      // Note that we don't need to finish the body with the closing boundary because
      // we'll be aborting the request anyway
    ];

    // Calculate the content size.  We need to know this because if we send a Content-Length
    // header with a too-small value, the server will think it has all the data before we
    // have a chance to abort
    var contentSize = _.reduce(body, function(memo,chunk){return memo+chunk.length;}, 0);

    // Set up the request options
    var options = {
      host: domain,
      port: port,
      path: '/upload_abort',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data;boundary=myawesomemultipartboundary',
        'Content-Length': contentSize + 100
      }
    };

    // Make the request
    var req = http.request(options,
      // This callback should never be called, since the request
      // should end in an error after we abort it
      function(res) {
        return done("The request should have returned an error!");
      }
    );

    // Handle the request error
    req.on('error', function(e)  {
      return done();
    });

    // Send the body one piece at a time
    _.map(body, function(chunk) {req.write(chunk);});

    // Abort the request
    setTimeout(function() {
      req.abort();
      req.end();
    }, 100);
  });

});
