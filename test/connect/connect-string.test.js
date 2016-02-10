var assert = require("assert");
var mongo = require("../../index");
var path = require("path");
describe('Connect', function () {
    describe('Connect string', function () {
        it('Build Connection string', function () {
            var s = mongo.db.connectionString({
                port: 45882,
                host: "ds045882.mongolab.com",
                database: "salvia",
                user: "salvia",
                password: "salvia"

            });
            assert.equal(s, "mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia");
            var s1 = mongo.db.connectionString({
                port: 45882,
                host: "ds045882.mongolab.com",
                database: "salvia"

            });
            assert.equal(s1, "mongodb://ds045882.mongolab.com:45882/salvia");
            var s3 = mongo.db.connectionString({
                database: "salvia"

            });
            assert.equal(s3, "mongodb://localhost/salvia");
        });

    });

})


