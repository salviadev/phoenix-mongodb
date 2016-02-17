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
var podata = require('phoenix-odata');
var mongodb_result_1 = require('./mongodb-result');
function _executeQuery(collection, filter, options, cb, addCount) {
    if (!options.limit)
        options.limit = 100;
    if (options.group) {
        let pipeline = [];
        pipeline.push({ $match: filter });
        pipeline.push({ $group: options.group });
        if (options.havingFilter)
            pipeline.push({ $match: options.havingFilter });
        if (!addCount && options.sort)
            pipeline.push({ $sort: options.sort });
        if (!addCount && options.skip)
            pipeline.push({ $skip: options.skip });
        if (!addCount && options.limit)
            pipeline.push({ $limit: options.limit });
        if (addCount) {
            pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
        }
        collection.aggregate(pipeline, cb);
    }
    else {
        let cursor = collection.find(filter);
        if (options.sort)
            cursor = cursor.sort(options.sort);
        if (options.skip)
            cursor = cursor.skip(options.skip);
        if (options.limit)
            cursor = cursor.limit(options.limit);
        cursor.toArray(cb);
    }
}
function _executeQueryCount(collection, filter, options, callback) {
    if (options.group) {
        _executeQuery(collection, filter, options, function (ex, docs) {
            if (ex)
                return callback(ex, 0);
            callback(null, (docs && docs.length ? docs[0].count : 0));
        }, true);
    }
    else {
        let cursor = collection.find(filter);
        cursor.count(false, null, callback);
    }
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
    if (options.text) {
        let keys = Object.keys(filter);
        if (!keys.length || filter.$and || filter.$or || filter.$where) {
            filter.$text = options.text;
        }
        else {
            filter = { $and: [filter], $text: options.text };
        }
    }
    return new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function (ex, db) {
            if (ex)
                return reject(ex);
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return rejectAndClose(db, reject, ex);
                let count;
                _executeQuery(collection, filter, options, function (ex, docs) {
                    docs = mongodb_result_1.extractOdataResult(docs || [], schema, options);
                    if (options.limit) {
                        if (docs.length < options.limit) {
                            if (options.count) {
                                options.count = false;
                                count = (options.skip || 0) + docs.length;
                            }
                        }
                        else
                            docs.pop();
                    }
                    if (options.count) {
                        _executeQueryCount(collection, filter, options, function (ex, totalCount) {
                            if (ex)
                                return rejectAndClose(db, reject, ex);
                            count = totalCount;
                            resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                        });
                    }
                    else
                        resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                }, false);
            });
        });
    });
}
exports.execOdataQuery = execOdataQuery;
function execOdataQueryId(connetionString, collectionName, schema, primaryKey, options) {
    return new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function (ex, db) {
            if (ex)
                return reject(ex);
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return rejectAndClose(db, reject, ex);
                let count;
                collection.find(primaryKey).limit(1).toArray(function (ex, docs) {
                    if (!docs || !docs.length) {
                        return rejectAndClose(db, reject, { message: "Document not found.", status: 404 });
                    }
                    return resolveAndClose(db, resolve, mongodb_result_1.extractOdataResult(docs[0], schema, options));
                });
            });
        });
    });
}
exports.execOdataQueryId = execOdataQueryId;
