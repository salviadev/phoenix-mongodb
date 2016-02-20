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
            return bucket.delete(id, function (err) {
                if (err)
                    return cb(err);
                return cb(null);
            });
        }
        return cb(null);
    });
}
function notFound() {
    return new putils.http.HttpError("Not found", 404);
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
                    return closeAndCb(notFound());
                }
                let old = docs[0];
                //id = old[propertyName];
                let ov = putils.utils.value(old, propertyName);
                if (ov) {
                    return removeFile(db, old[propertyName], function (err) {
                        if (err)
                            return closeAndCb(err);
                        return uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function (err, id) {
                            if (err)
                                return closeAndCb(err);
                            //old[propertyName] = id;
                            putils.utils.setValue(old, propertyName, id);
                            old[propertyName] = id;
                            return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                if (err)
                                    return closeAndCb(err);
                                closeAndCb(null);
                            });
                        });
                    });
                }
                else {
                    return uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function (err, id) {
                        if (err)
                            return closeAndCb(err);
                        //old[propertyName] = id;
                        putils.utils.setValue(old, propertyName, id);
                        return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
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
function downloadBinaryProperty(uri, schema, pk, propertyName, res, cb) {
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
                    return closeAndCb(notFound());
                }
                let old = docs[0];
                //id = old[propertyName];
                let ov = putils.utils.value(old, propertyName);
                if (!ov)
                    return closeAndCb(notFound());
                try {
                    let bucket = _bucket(db);
                    console.log("Before  bucket.find ");
                    console.log(ov);
                    bucket.find({ _id: ov }, { batchSize: 1 }).toArray(function (err, files) {
                        if (err)
                            return cb(err);
                        if (files && files.length) {
                            let file = files[0];
                            let downStream = bucket.openDownloadStream(ov);
                            let ct = file.contentType || '';
                            let attachement = (ct.indexOf('image/') !== 0 && ct.indexOf('video/') !== 0);
                            if (attachement)
                                res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
                            else
                                res.setHeader('Content-type', ct);
                            return downStream.pipe(res).
                                on('error', function (error) {
                                closeAndCb(error);
                            }).
                                on('finish', function () {
                                closeAndCb(null);
                            });
                        }
                        return closeAndCb(notFound());
                    });
                }
                catch (ex) {
                    return closeAndCb(ex);
                }
            });
        });
    });
}
exports.downloadBinaryProperty = downloadBinaryProperty;
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
