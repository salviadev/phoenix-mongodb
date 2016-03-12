var assert = require("assert");
var testCreate = require("./usercreate.js").testCreate;
var cfg = require("../../config.js");
var schemas = require("../../data/schemas/user-model.js");


describe('Multitenant Shared Odata', function() {
    it('Basic test', function(done) {
        testCreate(schemas.userschema02, true, done);
    });
})

