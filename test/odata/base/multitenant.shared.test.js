var assert = require("assert");
var testCreate = require("./usercreate.js").testCreate;
var cfg = require("../../config.js");
var schemas = require("../../data/schemas/user-model.js");


describe('Multitenant Shared Odata', function() {
    it('Import shared users from file', function(done) {
        testCreate(schemas.suserschema, true, done);
    });
})

