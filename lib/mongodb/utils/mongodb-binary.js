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
var putils = require('phoenix-utils');
var mongodb = require('mongodb');
function _bucket(db) {
    return new mongodb.GridFSBucket(db, { bucketName: "fs" });
}
function removeFile(db, id, cb) {
    let bucket = _bucket(db);
    bucket.find({ _id: id }, { batchSize: 1 }).toArray(function (err, files) {
        if (err)
            return cb(err);
        if (files && files.length) {
            bucket.delete(id, function (err) {
                if (err)
                    return cb(err);
                return cb(null);
                return;
            });
        }
        return cb(null);
    });
}
function uploadBinaryProperty(uri, schema, pk, propertyName, fileName, contentType, stream, cb) {
    mongodb.MongoClient.connect(uri, function (err, db) {
        if (err)
            return cb(err);
        let closeAndCb = function (ex) {
            db.close(true, function (err) {
                cb(ex);
            });
        };
        db.collection(schema.name, function (ex, collection) {
            if (ex)
                return closeAndCb(ex);
            collection.find(pk).toArray(function (ex, docs) {
                if (ex)
                    return closeAndCb(ex);
                if (!docs.length) {
                    return closeAndCb(new putils.http.HttpError("Not found", 404));
                }
                let old = docs[0];
                if (old[propertyName]) {
                    removeFile(db, old[propertyName], function (err) {
                        if (err)
                            return closeAndCb(err);
                        uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function (err, id) {
                            old[propertyName] = id;
                            collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                if (err)
                                    return closeAndCb(err);
                                closeAndCb(null);
                            });
                        });
                    });
                }
                else {
                    uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function (err, id) {
                        old[propertyName] = id;
                        collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                            if (err)
                                return closeAndCb(err);
                            closeAndCb(null);
                        });
                    });
                }
            });
        });
    });
}
exports.uploadBinaryProperty = uploadBinaryProperty;
function uploadStream(db, schema, fileName, contentType, stream, tenantId, cb) {
    try {
        let bucket = _bucket(db);
        if (schema && schema.multiTenant) {
            if (!tenantId) {
                return cb(new putils.http.HttpError("Tenant id is empty.", 400), null);
            }
        }
        let options = {
            contentType: contentType,
            metadata: { tenantId: tenantId || 0, parent: schema ? schema.name : '' }
        };
        let uploadStream = bucket.openUploadStream(fileName, options);
        stream.pipe(uploadStream).
            on('error', function (error) {
            cb(error, null);
        }).
            on('finish', function () {
            cb(null, uploadStream.id);
        });
    }
    catch (ex) {
        cb(ex, null);
    }
}
exports.uploadStream = uploadStream;
