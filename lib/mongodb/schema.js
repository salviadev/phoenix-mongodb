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
var jsonSchema = require('phoenix-json-schema-tools');
var dbSchema = require('./utils/mongo-schema');
var mongodbp = require('./utils/mongo-promises');
var mongodbImport = require('./utils/mongo-import');
function createCollection(db, schema) {
    return __awaiter(this, void 0, Promise, function* () {
        yield jsonSchema.checkSchema(schema);
        let indexes = jsonSchema.indexesOfSchema(schema, true);
        let collection = yield dbSchema.db.createCollection(db, schema.name);
        yield dbSchema.collection.createIndexes(collection, indexes, schema.multiTenent);
    });
}
function createDatabase(db, schemas) {
    return __awaiter(this, void 0, Promise, function* () {
        yield dbSchema.db.dropCollections(db);
        let p = schemas.map(function (schema) {
            return createCollection(db, schema);
        });
        yield Promise.all(p);
    });
}
exports.createDatabase = createDatabase;
function importCollectionFromStream(db, schema, stream, override, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let collections = yield dbSchema.db.getCollections(db);
        let names = collections.map(collection => {
            return collection.collectionName;
        });
        let isNew = false;
        if (names.indexOf(schema.name) < 0) {
            yield createCollection(db, schema);
            isNew = false;
        }
        let collection = yield mongodbp.collection(db, schema.name);
        if (!isNew && isNew) {
        }
        mongodbImport.importCollectionFromStream(collection, schema, stream, override, tenantId);
    });
}
exports.importCollectionFromStream = importCollectionFromStream;
function importCollectionFromFile(db, schema, file, override, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let collections = yield dbSchema.db.getCollections(db);
        let names = collections.map(collection => {
            return collection.collectionName;
        });
        let isNew = false;
        if (names.indexOf(schema.name) < 0) {
            yield createCollection(db, schema);
            isNew = false;
        }
        let collection = yield mongodbp.collection(db, schema.name);
        if (!isNew && isNew) {
        }
        yield mongodbImport.importCollectionFromFile(collection, schema, file, override, tenantId);
    });
}
exports.importCollectionFromFile = importCollectionFromFile;
