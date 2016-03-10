"use strict";
const mongodb = require('mongodb');
function connectAndCache(uri, connections, cb) {
    if (connections && connections[uri]) {
        return cb(null, { db: connections[uri], cache: true });
    }
    mongodb.MongoClient.connect(uri, function (err, result) {
        if (err)
            return cb(err, null);
        else {
            var cache = false;
            if (connections && !connections[uri]) {
                connections[uri] = result;
                cache = true;
            }
            return cb(err, { db: result, cache: cache });
        }
    });
}
exports.connectAndCache = connectAndCache;
function connectAndCachePromise(uri, connections) {
    return new Promise((resolve, reject) => {
        connectAndCache(uri, connections, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.connectAndCachePromise = connectAndCachePromise;
function insert(collection, value) {
    return new Promise((resolve, reject) => {
        collection.insertOne(value, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.insert = insert;
function collection(db, collectionName) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.collection = collection;
function connect(uri) {
    return new Promise((resolve, reject) => {
        mongodb.MongoClient.connect(uri, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.connect = connect;
function close(db) {
    return new Promise((resolve, reject) => {
        db.close(true, function (err) {
            resolve();
        });
    });
}
exports.close = close;
