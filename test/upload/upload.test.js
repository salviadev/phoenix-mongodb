var assert = require("assert");
var mongo = require("../../index");
var path = require("path");
var mongodb = require("mongodb");
var uploadStream = require("../../lib/mongodb/utils/mongodb-binary").uploadStream;

var fs = require("fs");
describe('Binary', function () {
    
    it('Upload file to GridFS', function (done) {
        var success = false;
        var s = mongo.db.connectionString({
            port: 45882,
            host: "ds045882.mongolab.com",
            database: "salvia",
            user: "salvia",
            password: "salvia"

        });
        var is = fs.createReadStream(path.join(__dirname, 'data/image.jpg'));
        mongodb.MongoClient.connect(s, function (ex, db) {
            if (ex) {
                console.log(ex);
                success = false;
                assert.equal(success, true, "Upload done");
                done();
                return;
            }
           
            uploadStream(db, null, 'camus.jpg', is, 0, function (error, id) {
                if (!error)  success = true;
                db.close(true, function (ex) {
                    assert.equal(success, true, "Upload done");
                    done();
                });
            })


        });

        

    });

})


