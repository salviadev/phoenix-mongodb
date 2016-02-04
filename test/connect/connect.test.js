var assert = require("assert");
var mongo = require("../../index");
var path = require("path");
describe('Connect', function () {
    describe('Connect string', function () {
        it("Connected to mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia", function () {
            var s = mongo.connectionString({
                port: 45882,
                host: "ds045882.mongolab.com",
                database: "salvia",
                user: "salvia",
                password: "salvia"

            });
            assert.equal(s, "mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia");
            beforeEach(function (done) {

                mongo.db.connect(s).then(function (db) {
                    return mongo.db.close(db);
                }).then(function () {
                    assert.equal(1, 1, "Connected to " + 'mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia');
                    done();
                }).catch(function (ex) {
                    assert.equal(1, 0, "Can't connect to " + 'mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia');
                    console.log(ex);
                    done();
                });
            }, 5000);

        });

    });

})

