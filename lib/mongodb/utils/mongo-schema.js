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
function _createIndex(collection, indexFields, unique) {
    let fields = indexFields.split(",");
    let indexDesc = {};
    fields.forEach(function (field) {
        let fields = field.trim().split(' ');
        if (fields.length > 1)
            indexDesc[fields[0]] = fields[2] === 'desc' ? -1 : 1;
        else
            indexDesc[fields[0]] = 1;
    });
    return new Promise((resolve, reject) => {
        collection.createIndex(indexDesc, { unique: unique }, function (err, indexname) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function _createTextIndex(collection, indexFields) {
    let fields = indexFields.split(",");
    let indexDesc = {};
    fields.forEach(function (field) {
        let fields = field.trim().split(' ');
        indexDesc[fields[0]] = 'text';
    });
    return new Promise((resolve, reject) => {
        collection.createIndex(indexDesc, {}, function (err, indexname) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function _createIndexes(collection, indexes) {
    return __awaiter(this, void 0, Promise, function* () {
        if (indexes && indexes.length) {
            let p = [];
            for (let indexDesc of indexes) {
                if (indexDesc.text)
                    p.push(_createTextIndex(collection, indexDesc.fields));
                else
                    p.push(_createIndex(collection, indexDesc.fields, indexDesc.unique));
            }
            yield Promise.all(p);
        }
    });
}
exports.db = {
    getCollections: _getCollections,
    dropCollections: _removeCollections,
    createCollection: _createCollection,
    dropCollection: _dropCollection
};
exports.collection = {
    dropIndexes: _dropAllIndexes,
    createIndexes: _createIndexes
};
