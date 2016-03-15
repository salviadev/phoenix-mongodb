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
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)/photo%s", schema.name, tenentId), "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schema, odataUri,
                'john.smith.jpg', 'image/jpg', stream);
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId), "GET");
            return pmongo.odata.execQueryId(cfg.connect, connections, schema, odataUri);
        }).then(function(user) {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s?$filter=id eq 2%s", schema.name, tenentId2), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 1)
                Promise.reject(new Error('User with id = 2 not found.'));
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);
        }).then(function() {
            //delete on removed record
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {

        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(2)%s", schema.name, tenentId), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {
            
        }).then(function() {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s%s", schema.name, tenentId), "GET");
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



exports.testCreateMultitenant = function(schema, multiTenant, done) {
        var connections = {};
        var t1 = 1, t2 = 2;
        var tenentId01 =  (multiTenant ? ('?tenantId=' + t1) : '');
        var tenentId01_and =  (multiTenant ? ('&tenantId=' + t1) : '');
       
        var tenentId02 =  (multiTenant ? ('?tenantId=' + t2) : '');
        var tenentId02_and =  (multiTenant ? ('&tenantId=' + t2) : '');
       
        pmongo.schema.importCollectionFromFile(cfg.connect, connections, schema, path.join(__dirname, '../../data/data/users.json'), { truncate: true, onImported: null }, t1)
        .then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)/photo%s", schema.name, tenentId01), "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schema, odataUri,
                'john.smith.jpg', 'image/jpg', stream);
        }).then(function() {
            return pmongo.schema.importCollectionFromFile(cfg.connect, connections, schema, path.join(__dirname, '../../data/data/users.json'), { truncate: true, onImported: null }, t2)
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)/photo%s", schema.name, tenentId02), "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/john.smith.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schema, odataUri,
                'john.smith.jpg', 'image/jpg', stream);
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(2)/photo%s", schema.name, tenentId01), "POST");
            var stream = fs.createReadStream(path.join(__dirname, '../../data/photos/jane.doe.jpg'), {
                encoding: 'utf8'
            });
            return pmongo.upload.uploadBinaryProperty(cfg.connect, connections, schema, odataUri,
                'jane.doe.jpg', 'image/jpg', stream);
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId01), "GET");
            return pmongo.odata.execQueryId(cfg.connect, connections, schema, odataUri);
        }).then(function(user) {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s?$filter=id eq 2%s", schema.name, tenentId01_and), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 1)
                Promise.reject(new Error('User with id = 2 not found.'));
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId01), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);
        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId02), "GET");
            return pmongo.odata.execQueryId(cfg.connect, connections, schema, odataUri);
        }).then(function(user) {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s?$filter=id eq 2%s", schema.name, tenentId02_and), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 1)
                Promise.reject(new Error('User with id = 2 not found.'));
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId02), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);
        }).then(function() {
            //delete on removed record
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId01), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {

        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(2)%s", schema.name, tenentId01), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {
            
        }).then(function() {
            //delete on removed record
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(1)%s", schema.name, tenentId02), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {

        }).then(function() {
            var odataUri = podata.parseOdataUri(util.format("/master/odata/%s(2)%s", schema.name, tenentId02), "DELETE");
            return pmongo.odata.execDelete(cfg.connect, connections, schema, odataUri);}).then(function() {
            
        }).then(function() {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s%s", schema.name, tenentId01), "GET");
            return pmongo.odata.execQuery(cfg.connect, connections, schema, odataUri);
        }).then(function(users) {
            if (users.value.length !== 0)
                Promise.reject(new Error('Users found.'));
            return Promise.resolve();
        }).then(function() {
            odataUri = podata.parseOdataUri(util.format("/master/odata/%s%s", schema.name, tenentId02), "GET");
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