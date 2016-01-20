"use script";
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
var jsonSchema = require('phoenixJsonSchema');
var dbSchema = require('./dbschemautils');
function _jsonSchema2Database(db, schema) {
    return __awaiter(this, void 0, Promise, function* () {
        yield jsonSchema.checkSchema(schema);
        let indexes = jsonSchema.indexesOfSchema(schema, true);
        let collection = yield dbSchema.db.createCollection(db, schema.name);
        yield dbSchema.collection.createIndexes(collection, indexes);
    });
}
var fs = require('fs'), path = require("path"), async = require('async'), JSONStream = require('JSONStream'), schemaUtils = require('./dbschemautils'), schemaCtrls = require('../utils/schema-validation'), json = require("../utils/json"), mongoStream = require('./mongo-write-stream');
function _loadSchemaFromFiles(files, after) {
    return __awaiter(this, void 0, Promise, function* () {
        let schemas = [];
        if (!files || !files.length)
            return schemas;
        async.each(files, function (file, callback) {
            json.loadFromFile(file, function (err, schema) {
                if (err)
                    return callback(err);
                schemas.push(schema);
                callback(null);
            });
        }, function (err) {
            after(err, schemas);
        });
    });
}
function _importCollection(schema, collection, file, after, cb) {
    fs.open(file, 'r', function (err, fd) {
        var _after = function (error) {
            if (fd) {
                fs.close(fd, function (err) {
                    after(error);
                });
            }
            else
                after(error);
        };
        if (err)
            return _after(null);
        var stream = fs.createReadStream(file, {
            encoding: 'utf8'
        }), parser = JSONStream.parse('results.*'), ms = mongoStream(collection, schema);
        var r = stream.pipe(parser).pipe(ms);
        r.on('finish', function (data) {
            if (cb)
                cb(schema.$name, ms.inserted);
            _after();
        });
        r.on('error', function (err) {
            _after(err);
        });
    });
}
function _loadSchemaFromFolder(schemapath, after) {
    fs.readdir(schemapath, function (err, files) {
        if (err)
            return after(err, null);
        var jsonFiles = files.map(function (file) {
            return path.join(schemapath, file);
        }).filter(function (file) {
            return file.toLowerCase().indexOf(".json") > 0;
        });
        var fileList = [];
        async.each(jsonFiles, function (file, callback) {
            fs.stat(file, function (err, stats) {
                if (!err && stats.isFile())
                    fileList.push(file);
                callback(null);
            });
        }, function (err) {
            if (err)
                return after(err, null);
            _loadSchemaFromFiles(fileList, after);
        });
    });
}
;
function _createDatabaseCollections(db, schemapath, dataPath, cb, after) {
    _loadSchemaFromFolder(schemapath, function (err, schemas) {
        if (err)
            return after(err, null);
        schemaUtils.db.dropCollections(db, [], function (err, list) {
            if (err)
                return after(err, null);
            schemas = schemas || [];
            async.each(schemas, function (schema, callback) {
                _schema2Db(db, schema, function (err, collection) {
                    if (err)
                        return callback(err);
                    if (dataPath) {
                        _importCollection(schema, collection, path.resolve(dataPath, schema.$name + '.json'), function (err) {
                            if (err)
                                return callback(err);
                            else
                                return callback(null);
                        }, cb);
                    }
                    else
                        return callback(null);
                });
            }, function (err) {
                after(err, null);
            });
        });
    });
}
function _createCollection(db, schemaName, schemapath, dataPath, cb, after) {
    json.loadFromFile(path.resolve(schemapath, schemaName + '.json'), function (err, schema) {
        if (err)
            return after(err, null);
        schemaUtils.db.dropCollection(db, schema.$name, function (err) {
            if (err)
                return after(err, null);
            _schema2Db(db, schema, function (err, collection) {
                if (err)
                    return after(err, null);
                if (dataPath) {
                    _importCollection(schema, collection, path.resolve(dataPath, schema.$name + '.json'), function (err) {
                        if (err)
                            return after(err, null);
                        else
                            return after(null, null);
                    }, cb);
                }
                else
                    return after(null, null);
            });
        });
    });
}
module.exports = {
    createDatabase: _createDatabaseCollections,
    createCollection: _createCollection,
    createCollectionFromSchema: _schema2Db
};
