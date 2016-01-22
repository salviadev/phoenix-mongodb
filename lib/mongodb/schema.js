"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var jsonSchema = require('phoenix-json-schema-tools');
var dbSchema = require('./utils/mongo-schema');
var mongodbp = require('./utils/mongo-promises');
var mongodbImport = require('./utils/mongo-import');
function createCollection(db, schema) {
    return __awaiter(this, void 0, Promise, function* () {
        yield jsonSchema.checkSchema(schema);
        let indexes = jsonSchema.indexesOfSchema(schema, true);
        let collection = yield dbSchema.db.createCollection(db, schema.name);
        yield dbSchema.collection.createIndexes(collection, indexes);
    });
}
exports.createCollection = createCollection;
function createDatabase(db, schemas) {
    return __awaiter(this, void 0, Promise, function* () {
        let p = schemas.map(function (schema) {
            return createCollection(db, schema);
        });
        yield Promise.all(p);
    });
}
exports.createDatabase = createDatabase;
function createCollectionAndImportFromStream(db, schema, stream) {
    return __awaiter(this, void 0, Promise, function* () {
        yield createCollection(db, schema);
        let collection = yield mongodbp.collection(db, schema.name);
        mongodbImport.importCollectionFromStream(collection, schema, stream);
    });
}
exports.createCollectionAndImportFromStream = createCollectionAndImportFromStream;
function createCollectionAndImportFile(db, schema, file) {
    return __awaiter(this, void 0, Promise, function* () {
        yield createCollection(db, schema);
        let collection = yield mongodbp.collection(db, schema.name);
        yield mongodbImport.importCollectionFromFile(collection, schema, file);
    });
}
exports.createCollectionAndImportFile = createCollectionAndImportFile;
/*


var fs = require('fs'),
    path = require("path"),
    async = require('async'),
    JSONStream = require('JSONStream'),
    schemaUtils = require('./dbschemautils'),
    schemaCtrls = require('../utils/schema-validation'),
    json = require("../utils/json"),
    mongoStream = require('./mongo-write-stream');


async function _loadSchemaFromFiles(files, after) {
    let schemas = [];
    if (!files || !files.length) return schemas;

    async.each(files, function(file, callback) {
        json.loadFromFile(file, function(err, schema) {
            if (err) return callback(err);
            schemas.push(schema);
            callback(null);
        });

    }, function(err) {
        after(err, schemas);
    });
}










function _loadSchemaFromFolder(schemapath, after) {
    fs.readdir(schemapath, function(err, files) {
        if (err) return after(err, null);
        var jsonFiles = files.map(function(file) {
            return path.join(schemapath, file);

        }).filter(function(file) {
            return file.toLowerCase().indexOf(".json") > 0;
        });
        var fileList = [];
        async.each(jsonFiles, function(file, callback) {
            fs.stat(file, function(err, stats) {
                if (!err && stats.isFile())
                    fileList.push(file);
                callback(null);
            });

        }, function(err) {
            if (err)
                return after(err, null);
            _loadSchemaFromFiles(fileList, after);
        });

    });
};



function _createDatabaseCollections(db, schemapath, dataPath, cb, after) {
    _loadSchemaFromFolder(schemapath, function(err, schemas) {
        if (err) return after(err, null);
        schemaUtils.db.dropCollections(db, [], function(err, list) {
            if (err) return after(err, null);
            schemas = schemas || [];
            async.each(schemas, function(schema, callback) {
                createCollectionFromSchema(db, schema, function(err, collection) {
                    if (err) return callback(err);
                    if (dataPath) {
                        _importCollection(schema, collection, path.resolve(dataPath, schema.$name + '.json'), function(err) {
                            if (err)
                                return callback(err);
                            else
                                return callback(null);
                        }, cb);
                    } else
                        return callback(null);

                });

            }, function(err) {
                after(err, null);
            });


        });

    });
}





module.exports = {
    createCollection: _createCollection

};
*/ 
