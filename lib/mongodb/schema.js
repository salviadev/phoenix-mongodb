/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs');
const jsonSchema = require('phoenix-json-schema-tools');
const putils = require('phoenix-utils');
const mongodb_connection_1 = require('./utils/mongodb-connection');
const dbSchema = require('./utils/mongodb-schema');
const mongodbp = require('./utils/mongodb-promises');
const mongodbImport = require('./utils/mongodb-import');
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
function importCollectionFromStream(settings, connections, schema, stream, options, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let csettings = putils.utils.clone(settings, true);
        let connectionUri = mongodb_connection_1.mongoDbUri(csettings);
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
            yield mongodbImport.importCollectionFromStream(db, collection, schema, stream, options, tenantId);
        }
        finally {
            yield mongodbp.close(db);
        }
    });
}
exports.importCollectionFromStream = importCollectionFromStream;
function importCollectionFromFile(settings, connections, schema, file, options, tenantId) {
    return __awaiter(this, void 0, Promise, function* () {
        let stream = fs.createReadStream(file, {
            encoding: 'utf8'
        });
        yield importCollectionFromStream(settings, connections, schema, stream, options, tenantId);
    });
}
exports.importCollectionFromFile = importCollectionFromFile;
