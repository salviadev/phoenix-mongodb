var assert = require("assert");
var path = require("path");
var mongodb = require("mongodb");
var podata = require("phoenix-odata");
var util = require("util");
var cfg = require("../../config.js");

var pmongo = require("../../../index");
var fs = require("fs");

exports.testCreate = function(schema, multiTenant, done) {
        var connections = {};
        var t1 = 1;
        var tenentId =  (multiTenant ? ('?tenantId=' + t1) : '');
        var tenentId2 =  (multiTenant ? ('&tenantId=' + t1) : '');
       
        pmongo.schema.importCollectionFromFile(cfg.connect, connections, schema, path.join(__dirname, '../../data/data/users.json'), { truncate: true, onImported: null }, t1)
        .then(function() {
            var odataUri = podata.parseOdataUri(util.format("/odata/master/%s(1)/photo%s", schema.name, tenentId), "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schema, odataUri,
                'john.smith.jpg', 'image/jpg', stream);
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/odata/master/%s(1)%s", schema.name, tenentId), "GET");
            return pmongo.odata.execQueryId(cfg.connect, connections, schema, odataUri);
        }).then(function(user) {
            odataUri = podata.parseOdataUri(util.format("/odata/master/%s?$filter=id eq 2%s", schema.name, tenentId2), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 1)
                Promise.reject(new Error('User with id = 2 not found.'));
            var odataUri = podata.parseOdataUri(util.format("/odata/master/%s(1)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);
        }).then(function() {
            //delete on removed record
            var odataUri = podata.parseOdataUri(util.format("/odata/master/%s(1)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {

        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/odata/master/%s(2)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {
            
        }).then(function() {
            odataUri = podata.parseOdataUri(util.format("/odata/master/%s%s", schema.name, tenentId), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 0)
                Promise.reject(new Error('Users found.'));
            return Promise.resolve();
        }).then(function() {    
            done();
        }).catch(function(ex) {
            done(ex);
        });
    
}