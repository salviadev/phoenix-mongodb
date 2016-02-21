/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
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
var fs = require('fs');
var jsonSchema = require('phoenix-json-schema-tools');
var dbSchema = require('./utils/mongodb-schema');
var mongodbp = require('./utils/mongodb-promises');
var mongodbImport = require('./utils/mongodb-import');
function createCollection(db, schema) {
    return __awaiter(this, void 0, Promise, function* () {
        yield jsonSchema.schema.checkSchema(schema);
        let indexes = jsonSchema.schema.indexesOfSchema(schema, true);
        let collection = yield dbSchema.db.createCollection(db, schema.name);
        yield dbSchema.collection.createIndexes(collection, indexes, schema.multiTenent);
    });
}
function createCollections(connectionUri, schemas) {
    return __awaiter(this, void 0, Promise, function* () {
        let db = yield mongodbp.connect(connectionUri);
        try {
            yield dbSchema.db.dropCollections(db);
            let p = schemas.map(function (schema) {
                return createCollection(db, schema);
            });
            yield Promise.all(p);
        }
        finally {
            yield mongodbp.close(db);
        }
    });
}
exports.createCollections = createCollections;
function importCollectionFromStream(connectionUri, schema, stream, options, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let db = yield mongodbp.connect(connectionUri);
        try {
            let collections = yield dbSchema.db.getCollections(db);
            let names = collections.map(collection => {
                return collection.collectionName;
            });
            let isNew = false;
            if (names.indexOf(schema.name) < 0) {
                // collection not found create it.
                yield createCollection(db, schema);
                isNew = false;
            }
            let collection = yield mongodbp.collection(db, schema.name);
            if (!isNew && options.truncate) {
                yield dbSchema.db.clearCollection(db, collection, schema, tenantId || 0);
            }
            yield mongodbImport.importCollectionFromStream(collection, schema, stream, options, tenantId);
        }
        finally {
            yield mongodbp.close(db);
        }
    });
}
exports.importCollectionFromStream = importCollectionFromStream;
function importCollectionFromFile(connectionUri, schema, file, options, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let stream = fs.createReadStream(file, {
            encoding: 'utf8'
        });
        yield importCollectionFromStream(connectionUri, schema, stream, options, tenantId);
    });
}
exports.importCollectionFromFile = importCollectionFromFile;
