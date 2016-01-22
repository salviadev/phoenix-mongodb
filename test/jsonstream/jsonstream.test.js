var assert = require("assert");
var mongoImport = require("../../lib/mongodb/import");
var path = require("path");
describe('Import', function () {
    describe('Parse Json Stream', function () {
        it('Load json from file stream', function () {
            mongoImport.importCollectionFromFile(null, null, path.join(__dirname, 'fixtures', 'data.json')).then(function (err) {
               console.log('Finish');
            }).catch(function (err) {
                console.log(err);
            });
        });

    });

})
