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
        pmongo.schema.importCollectionFromFile(cfg.connect, connections, schemas.userschema, path.join(__dirname, '../../data/data/users.json'), { truncate: true, onImported: null }, 1)
        .then(function() {
            var odataUri = podata.parseOdataUri("/odata/master/user(1)/photo", "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schemas.userschema, odataUri,
                'john.smith.jpg', 'image/jpg', stream);
        }).then(function() {
            var odataUri = podata.parseOdataUri("/odata/master/user(1)", "GET");
            return pmongo.odata.execQueryId(cfg.connect, connections, schemas.userschema, odataUri);
        }).then(function(user) {
            odataUri = podata.parseOdataUri("/odata/master/user?$filter=id eq 2", "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schemas.userschema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 1)
                Promise.reject(new Error('User with id = 2 not found.'));
            var odataUri = podata.parseOdataUri("/odata/master/user(1)", "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schemas.userschema, odataUri);
        }).then(function() {
            //delete on removed record
            var odataUri = podata.parseOdataUri("/odata/master/user(1)", "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schemas.userschema, odataUri);}).then(function() {

        }).then(function() {
            var odataUri = podata.parseOdataUri("/odata/master/user(2)", "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schemas.userschema, odataUri);}).then(function() {
            
        }).then(function() {
            odataUri = podata.parseOdataUri("/odata/master/user", "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schemas.userschema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 0)
                Promise.reject(new Error('Users found.'));
            return Promise.resolve();
        }).then(function() {    
            done();
        }).catch(function(ex) {
            done(ex);
        });

    });

})

