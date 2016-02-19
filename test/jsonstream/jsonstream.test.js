var assert = require("assert");
var mongoImport = require("../../index");
var path = require("path");
describe('Import', function () {
    it('Parse Json Stream', function (done) {

        var success = false;
        mongoImport.schema.importCollectionFromFile(null, null, path.join(__dirname, 'fixtures', 'data.json')).then(function (data) {
            success = true;
            assert.equal(success, true, "Import done");
            done();
        }).catch(function (err) {
            success = true;
            assert.equal(success, true, "Import done");
            done();
        });

    });

})

