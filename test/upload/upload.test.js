var assert = require("assert");

var path = require("path");
var mongodb = require("mongodb");
var cfg = require("../config.js");
var uploadStream = require("../../lib/mongodb/utils/mongodb-binary").uploadStream;
var removeFileById = require("../../lib/mongodb/utils/mongodb-binary").removeFileById;
var mongoDbUri = require("../../lib/mongodb/utils/mongodb-connection").mongoDbUri;

var fs = require("fs");
describe('Binary', function() {

    it('Upload file to GridFS', function(done) {
        var success = false;
        var s = mongoDbUri(cfg.connect);
        var is = fs.createReadStream(path.join(__dirname, 'data/image.jpg'));
        mongodb.MongoClient.connect(s, function(ex, db) {
            if (ex) {
                if (ex) {
                    return done(ex);
                }
                done();
                return;
            }
            //upload file to gridFS      
            uploadStream(db, null, '', 'camus.jpg', 'image/jpeg', is, 0, function(error, id) {
                if (error)
                    return db.close(true, function(ex) {
                        done(error);
                    });
                //remove file from gridFS         
                removeFileById(db, id, '', function(err) {
                    return db.close(true, function(ex) {
                        return done(err);
                    });
                });

            })


        });



    });

})


