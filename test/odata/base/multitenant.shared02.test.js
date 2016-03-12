var assert = require("assert");
var testCreate = require("./usercreate.js").testCreateMultitenant;
var cfg = require("../../config.js");
var schemas = require("../../data/schemas/user-model.js");


describe('Multitenant Complex Shared Odata', function() {
    it('Complex test', function(done) {
        testCreate(schemas.userschema03, true, done);
    });
})

