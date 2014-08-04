describe('after uploading a file using this adapter, Skipper', function() {

  before(bindTestRoute);

  describe('each file metadata object', function () {

    var metadataAboutUploadedFiles = [];

    before(function (done){

      // Do 2 requests at once to up the stakes a bit
      require('async').series([
        function (cb) {
          uploadFiles({
            foo: 'hello',
            bar: 'there',
            avatar: fsx.createReadStream( fixtures.files[0].path ),
            logo: fsx.createReadStream( fixtures.files[1].path )
          },function (err, _metadata) {
            if (err) return cb(err);
            metadataAboutUploadedFiles = metadataAboutUploadedFiles.concat(_metadata);
            cb();
          });
        },
        function (cb) {
          uploadFiles({
            foo: 'hello again',
            bar: 'there again',
            avatar: fsx.createReadStream( fixtures.files[0].path ),
            logo: fsx.createReadStream( fixtures.files[1].path ),
            userFile: [
              fsx.createReadStream( fixtures.files[2].path ),
              fsx.createReadStream( fixtures.files[2].path ),
              fsx.createReadStream( fixtures.files[3].path ),
              fsx.createReadStream( fixtures.files[3].path )
            ]
          },function (err, _metadata) {
            if (err) return cb(err);
            metadataAboutUploadedFiles = metadataAboutUploadedFiles.concat(_metadata);
            cb();
          });
        }], done);
    });

    it('should be an object', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        assert.equal(typeof obj, 'object');
      });
    });

    describe('field', function (){
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.field, 'string');
        });
      });
    });

    it('should have the original filename of the uploaded file', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        if (obj.field === 'avatar') {
          var nameOfUploadedFile = require('path').basename(fixtures.files[0].path);
          assert.equal(obj.filename, nameOfUploadedFile);
        }
      });
    });

    describe('file descriptor (`fd`)', function () {
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.fd, 'string');
        });
      });
      it('should be within the specified `dirname` if one was provided', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'avatar') {
            var expectedDirname = '/tmp/avatar-uploads';
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should have basename === `saveAs` if a string was passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'logo') {
            assert.equal(require('path').basename(obj.fd), 'the_logo.jpg');
          }
        });
      });
      it('should be within the specified `dirname` even if a string was passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'logo') {
            var expectedDirname = '/tmp';
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should have expected basename when a function is passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'userFile') {
            assert.equal(require('path').basename(obj.fd), 'user-file__'+obj.filename);
          }
        });
      });
      it('should be within the specified `dirname` even if a function is passed in for `saveAs`', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'userFile') {
            var expectedDirname = '/tmp/user-files';
            assert(obj.fd.indexOf(expectedDirname) === 0, require('util').format('Expected fd (%s) to be inside the specified dirname (%s)', obj.fd, expectedDirname));
          }
        });
      });
      it('should default to a UUID as its basename if `saveAs` was not specified', function () {
        _.each(metadataAboutUploadedFiles, function (obj){
          if (obj.field === 'avatar') {
            console.log(require('path').basename(obj.fd));
            assert(require('path').basename(obj.fd).match(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/), require('util').format('Expected fd (%s) to be a UUID', obj.fd));
          }
        });
      });
    });

    it.skip('should contain the file size', function (){
      _.each(metadataAboutUploadedFiles, function (obj){
        assert.equal(typeof obj.size, 'number');
      });
    });

    describe('type', function (){
      it('should be a string', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(typeof obj.type, 'string');
        });
      });
      it('should otherwise default to "application/octet-stream"', function (){
        _.each(metadataAboutUploadedFiles, function (obj){
          assert.equal(obj.type, 'application/octet-stream');
        });
      });
    });
  });

});




/**
 * A function which builds an HTTP request with attached multipart
 * form upload(s), checking that everything worked.
 */
function uploadFiles(fields, cb) {
  // console.log('---- BEGIN NEW REQUEST ----');
  var httpRequest = request.post(baseurl+'/upload', onResponse);
  var form = _.reduce(fields, function (form,value,fieldName){
    if (_.isArray(value)) {
      _.each(value, function (_item) {
        form.append(fieldName, _item);
      });
    }
    else form.append(fieldName, value);

    return form;
  }, httpRequest.form());

  // Then check that it worked.
  function onResponse (err, response, body) {
    if (err) return cb(err);
    else if (response.statusCode >= 300) return cb(body || response.statusCode);
    else {
      if (_.isString(body)) {
        try { body = JSON.parse(body); } catch (e){}
      }

      // _.each(body, function (obj){
      //   console.log('--------******---------','\n',obj);
      // });

      cb(err, body);
    }
  }
}



function bindTestRoute() {
  // Set up a route which listens to uploads
  app.post('/upload', function (req, res, next) {
    assert(_.isFunction(req.file));


    require('async').auto({
      // defaults (uuid for the fd)
      avatar: function (cb) {
        req.file('avatar').upload({
          adapter: adapter,
          dirname: '/tmp/avatar-uploads'

          // NOT THIS:
          // (only the local disk adapter should do this-- i.e. for an S3
          // upload, how is the cwd relevant?)
          // require('path').join(process.cwd(), '.tmp/avatar-uploads')
        }, cb);
      },
      // hard-coded string for `saveAs` (one-off fd, always the same)
      logo: function (cb) {
        req.file('logo').upload({
          adapter: adapter,
          dirname: '/tmp',
          saveAs: 'the_logo.jpg'
        }, cb);
      },
      // function for `saveAs` (for customizing the fd)
      userFile: function (cb) {
        req.file('userFile').upload({
          adapter: adapter,
          dirname: '/tmp/user-files',
          saveAs: function (newFile, cb) {
            cb(null, 'user-file__'+newFile.filename);
          }
        }, cb);
      }
    }, function (err, async_data) {
      if (err) return next(err);

      // Merge all uploaded file metadata together into one array
      // for use in the tests below
      var _files = _.reduce(async_data, function (m,v,k){
        m = m.concat(v);
        return m;
      }, []);

      res.statusCode = 200;
      return res.json(_files);
    });

  });
}

