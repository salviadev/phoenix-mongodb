var assert = require("assert");
var mongoDbUri = require("../../lib/mongodb/utils/mongodb-connection").mongoDbUri;
var path = require("path");
describe('Connect', function () {
    it('Build Connection string', function () {
        var s = mongoDbUri({
            port: 45882,
            host: "ds045882.mongolab.com",
            database: "salvia",
            user: "salvia",
            password: "salvia"

        });
        assert.equal(s, "mongodb://salvia:salvia@ds045882.mongolab.com:45882/salvia");
        var s1 = mongoDbUri({
            port: 45882,
            host: "ds045882.mongolab.com",
            database: "salvia"

        });
        assert.equal(s1, "mongodb://ds045882.mongolab.com:45882/salvia");
        var s3 = mongoDbUri({
            database: "salvia"

        });
        assert.equal(s3, "mongodb://localhost/salvia");
    });


})


