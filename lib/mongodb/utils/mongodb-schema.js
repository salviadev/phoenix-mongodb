"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const pschema = require('phoenix-json-schema-tools');
const mbinary = require('./mongodb-binary');
function _getCollections(db) {
    return new Promise((resolve, reject) => {
        db.collections(function (err, collections) {
            if (err)
                reject(err);
            else
                resolve(collections);
        });
    });
}
function _dropCollection(db, collectionName) {
    return new Promise((resolve, reject) => {
        db.dropCollection(collectionName, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function _removeCollections(db, except) {
    return __awaiter(this, void 0, Promise, function* () {
        let collections = yield _getCollections(db);
        let p = [];
        for (let i = 0, len = collections.length; i < len; i++) {
            let collection = collections[i];
            if (except && except.indexOf(collection.collectionName) >= 0)
                continue;
            if (collection.collectionName.indexOf('system.') === 0)
                continue;
            p.push(_dropCollection(db, collection.collectionName));
        }
        yield Promise.all(p);
    });
}
function _dropAllIndexes(db, collection) {
    return new Promise((resolve, reject) => {
        collection.dropIndexes(function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function _clearCollection(db, collection, schema, tenantId) {
    return new Promise((resolve, reject) => {
        let hasBinaryFields = pschema.schema.fieldsByType(schema, 'binary').length > 0;
        let promises = [];
        let filter = {};
        if (tenantId)
            filter.tenantId = tenantId;
        if (hasBinaryFields) {
            return mbinary.removeFilesByParent(db, schema.name, tenantId || 0, function (ex) {
                if (ex)
                    return reject(ex);
                return collection.deleteMany(filter, function (error, result) {
                    if (error)
                        return reject(error);
                    resolve();
                });
            });
        }
        else
            return collection.deleteMany(filter, function (error, result) {
                if (error)
                    return reject(error);
                resolve();
            });
    });
}
function _createCollection(db, collectionName) {
    return new Promise((resolve, reject) => {
        db.createCollection(collectionName, function (err, collection) {
            if (err)
                reject(err);
            else
                resolve(collection);
        });
    });
}
function _getIndexDesc(collection, indexFields, unique, multiTenant) {
    let fields = indexFields.split(',');
    let indexDesc = {};
    if (multiTenant)
        indexDesc.tenantId = 1;
    fields.forEach(function (field) {
        let fields = field.trim().split(' ');
        if (fields.length > 1)
            indexDesc[fields[0]] = fields[2] === 'desc' ? -1 : 1;
        else
            indexDesc[fields[0]] = 1;
    });
    return {
        key: indexDesc,
        unique: unique
    };
}
function _getTextIndexDesc(collection, indexFields) {
    let fields = indexFields.split(",");
    let indexDesc = {};
    fields.forEach(function (field) {
        let fields = field.trim().split(' ');
        indexDesc[fields[0]] = 'text';
    });
    return {
        key: indexDesc
    };
}
function _createIndexes(collection, indexes, multiTenant) {
    if (indexes && indexes.length) {
        let p = [];
        for (let indexDesc of indexes) {
            if (indexDesc.text)
                p.push(_getTextIndexDesc(collection, indexDesc.fields));
            else
                p.push(_getIndexDesc(collection, indexDesc.fields, indexDesc.unique, multiTenant));
        }
        return collection.createIndexes(p);
    }
    else
        return Promise.resolve(undefined);
}
exports.db = {
    getCollections: _getCollections,
    dropCollections: _removeCollections,
    createCollection: _createCollection,
    clearCollection: _clearCollection,
    dropCollection: _dropCollection
};
exports.collection = {
    dropIndexes: _dropAllIndexes,
    createIndexes: _createIndexes
};
