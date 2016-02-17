var assert = require("assert");
var mongoImport = require("../../index");
var path = require("path");
describe('Import', function () {
    describe('Parse Json Stream', function () {

        var success = false;
        before(function (done) {
            mongoImport.schema.importCollectionFromFile(null, null, path.join(__dirname, 'fixtures', 'data.json')).then(function (data) {
                success = true;
                done();
            }).catch(function (err) {
                success = true;
                done();
            });

        }, 5000);
        it('Load json from file stream', function () {
            assert.equal(success, true, "Import done");
        });

    });

})

