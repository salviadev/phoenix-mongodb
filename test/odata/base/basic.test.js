var assert = require("assert");
var path = require("path");
var mongodb = require("mongodb");
var podata = require("phoenix-odata");
var cfg = require("../../config.js");
var schemas = require("../../data/schemas/user-model.js");
var pmongo = require("../../../index");
var fs = require("fs");
describe('Odata', function() {
    it('Import users from file', function(done) {
        var connections = {};
        var importUsers = pmongo.schema.importCollectionFromFile(cfg.connect, connections, schemas.userschema, path.join(__dirname, '../../data/data/users.json'), { truncate: true, onImported: null }, 1);
        assert.doesNotThrow(function() {
            importUsers.then(function() {
                var odataUri = podata.parseOdataUri("/odata/master/user(1)/photo", "POST");
                var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                    encoding: 'utf8'
                });

                pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schemas.userschema, odataUri,
                    'john.smith.jpg', 'image/jpg', stream, function(ex) {
                        if (ex) return done(ex);
                        odataUri = podata.parseOdataUri("/odata/master/user(1)", "GET");
                        pmongo.odata.execQueryId(cfg.connect, connections, schemas.userschema, odataUri).then(function(user){
                            done();
                        }).catch(function(err) {
                            done(err);    
                        })
                        
                        
                    });
            }).catch(function(ex) {
                done(ex);
            });
        });

    });

})

