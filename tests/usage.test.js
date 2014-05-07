describe('skipper', function() {


  it('should expose req.file()', function(done) {

    app.use(function (req, res, next) {
      assert(_.isFunction(req.file));
      next();
    });

    request(baseurl, function(err, response, body) {
      if (err) return done(err);
      done();
    });

  });

});
