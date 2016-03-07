var assert = require("assert");

var path = require("path");
var mongodb = require("mongodb");
var cfg = require("../config.js");
var uploadStream = require("../../lib/mongodb/utils/mongodb-binary").uploadStream;
var mongoDbUri = require("../../lib/mongodb/utils/mongodb-connection").mongoDbUri;

var fs = require("fs");
describe('Binary', function () {
    
    it('Upload file to GridFS', function (done) {
        var success = false;
        var s = mongoDbUri(cfg.connect);
        var is = fs.createReadStream(path.join(__dirname, 'data/image.jpg'));
        mongodb.MongoClient.connect(s, function (ex, db) {
            if (ex) {
                console.log(ex);
                success = false;
                assert.equal(success, true, "Upload done");
                done();
                return;
            }
           
            uploadStream(db, null, '', 'camus.jpg', 'image/jpeg', is, 0, function (error, id) {
                if (!error)  success = true;
                db.close(true, function (ex) {
                    assert.equal(success, true, "Upload done");
                    done();
                });
            })


        });

        

    });

})


