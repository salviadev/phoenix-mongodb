/// <reference path="../../../../node_modules/phoenix-odata/lib/definitions/phoenix-odata.d.ts" />
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
var mongodb = require('mongodb');
function _executeQuery(collection, filter, options, cb) {
    let cursor = collection.find(filter);
    if (options.sort)
        cursor = cursor.sort(options.sort);
    if (options.skip)
        cursor = cursor.skip(options.skip);
    if (options.limit)
        cursor = cursor.limit(options.limit);
    cursor.toArray(cb);
}
function _executeQueryCount(collection, filter, options, callback) {
    let cursor = collection.find(filter);
    cursor.count(false, null, callback);
}
function rejectAndClose(db, reject, reason) {
    db.close(true, function (ex) {
        reject(reason);
    });
}
function resolveAndClose(db, resolve, data) {
    db.close(true, function (ex) {
        resolve(data);
    });
}
function execOdataQuery(connetionString, collectionName, schema, filter, options) {
    return new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function (ex, db) {
            if (ex)
                return reject(ex);
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return rejectAndClose(db, reject, ex);
                let count;
                if (options.count) {
                    _executeQueryCount(collection, filter, options, function (ex, totalCount) {
                        if (ex)
                            return rejectAndClose(db, reject, ex);
                        count = totalCount;
                        _executeQuery(collection, filter, options, function (ex, docs) {
                            resolveAndClose(db, resolve, { value: docs || [] });
                        });
                    });
                }
                else {
                    _executeQuery(collection, filter, options, function (ex, docs) {
                        if (ex)
                            return rejectAndClose(db, reject, ex);
                        resolveAndClose(db, resolve, { value: docs || [] });
                    });
                }
            });
        });
    });
}
exports.execOdataQuery = execOdataQuery;
