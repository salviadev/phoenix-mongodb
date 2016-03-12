var assert = require("assert");
var testCreate = require("./usercreate.js").testCreate;
var cfg = require("../../config.js");
var schemas = require("../../data/schemas/user-model.js");


describe('Odata', function() {
    it('Import users from file', function(done) {
        testCreate(schemas.userschema01, false, done);
    });
})

