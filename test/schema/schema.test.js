var assert = require("assert");
var path = require("path");
var mongodb = require("mongodb");
var cfg = require("../config.js");
var pmongo= require("../../index");
var mongoDbUri = require("../../lib/mongodb/utils/mongodb-connection").mongoDbUri;

var fs = require("fs");
describe('Schema', function () {
    
    it('Import from file', function (done) {
        var s = mongoDbUri(cfg.connect);
        var impImages = pmongo.schema.importCollectionFromFile(s, cfg.schema, path.join(__dirname, 'data/images.json'), {truncate: true, onImported: null}, 1);
        impImages.then(function(){
            assert.equal(true,  true);
            done();
        }).catch(function(ex) {
            assert.equal(ex, null);
            done();
        });
        
    });

})

