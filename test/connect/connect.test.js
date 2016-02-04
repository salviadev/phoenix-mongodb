var assert = require("assert");
var mongo = require("../../index");
var path = require("path");
describe('Connect', function () {
    describe('Connect string', function () {
        var s = mongo.connectionString({
            port: 45882,
            host: "ds045882.mongolab.com",
            database: "salvia",
            user: "salvia",
            password: "salvia"

        });
        before(function (done) {

            mongo.db.connect(s).then(function (db) {
                return mongo.db.close(db);
            }).then(function () {
                done();
            }).catch(function (ex) {
                console.log(ex);
                done();
            });
        }, 5000);
        it("Connected to mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia", function () {
            assert.equal(s, "mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia")

        });

    });

})

