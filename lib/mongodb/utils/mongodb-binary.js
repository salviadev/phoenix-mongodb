"use strict";
const putils = require('phoenix-utils');
var mongodb = require('mongodb');
const mongodb_promises_1 = require('./mongodb-promises');
const mongodb_helper_1 = require('./mongodb-helper');
//get bucket name
function _bucket(db, prefix) {
    return new mongodb.GridFSBucket(db, { bucketName: prefix + 'fs' });
}
// Remove a file by id
function removeFileById(db, id, schemaPrefix, cb) {
    let bucket = _bucket(db, schemaPrefix);
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
exports.removeFileById = removeFileById;
function removeFileByIdPromise(db, id, schemaPrefix) {
    return new Promise((resolve, reject) => {
        removeFileById(db, id, schemaPrefix, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
exports.removeFileByIdPromise = removeFileByIdPromise;
// Remove all files that are referenced by an entity
function removeFilesByParent(db, parent, schemaPrefix, tenantId, cb) {
    let bucket = _bucket(db, schemaPrefix);
    bucket.find({ "metadata.tenantId": tenantId || 0, "metadata.parent": parent }, { batchSize: 1 }).toArray(function (err, files) {
        if (err)
            return cb(err);
        if (files && files.length) {
            let promises = [];
            files.forEach(function (file) {
                promises.push(bucket.delete(file._id));
            });
            Promise.all(promises).then(function () {
                cb(null);
            }).catch(function (ex) {
                cb(ex);
            });
        }
        else
            cb(null);
    });
}
exports.removeFilesByParent = removeFilesByParent;
function notFound() {
    return new putils.http.HttpError("Not found", 404);
}
//Upload a file 
// In the parent binary property set the "id" of file
// In the file (fs.files) metadata set the reference yto parent entity
function uploadBinaryProperty(settings, connections, schema, odataUri, fileName, contentType, stream) {
    return new Promise((resolve, reject) => {
        try {
            let opts = mongodb_helper_1.parseRequestById(settings, connections, schema, odataUri);
            mongodb_promises_1.connectAndCache(opts.connetionString, connections, function (err, connection) {
                if (err)
                    return reject(err);
                let db = connection.db;
                db.collection(opts.collectionName, function (ex, collection) {
                    if (ex)
                        return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                    collection.find(opts.primaryKey).toArray(function (ex, docs) {
                        if (ex)
                            return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                        if (!docs.length) {
                            return mongodb_helper_1.rejectAndClose(connection, reject, notFound());
                        }
                        let old = docs[0];
                        //id = old[propertyName];
                        let ov = putils.utils.value(old, opts.propertyName);
                        if (ov) {
                            return removeFileById(db, old[opts.propertyName], opts.prefix, function (err) {
                                if (err)
                                    return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                return uploadStream(db, schema, opts.prefix, fileName, contentType, stream, opts.primaryKey.tenantId, function (err, id) {
                                    if (err)
                                        return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                    //old[propertyName] = id;
                                    putils.utils.setValue(old, opts.propertyName, id);
                                    return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                        if (err)
                                            return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                        return mongodb_helper_1.resolveAndClose(connection, resolve);
                                    });
                                });
                            });
                        }
                        else {
                            return uploadStream(db, schema, opts.prefix, fileName, contentType, stream, opts.primaryKey.tenantId, function (err, id) {
                                if (err)
                                    return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                //old[propertyName] = id;
                                putils.utils.setValue(old, opts.propertyName, id);
                                return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                    if (err)
                                        return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                    return mongodb_helper_1.resolveAndClose(connection, resolve);
                                });
                            });
                        }
                    });
                });
            });
        }
        catch (ex) {
            reject(ex);
        }
    });
}
exports.uploadBinaryProperty = uploadBinaryProperty;
function downloadBinaryProperty(settings, connections, schema, odataUri, res) {
    return new Promise((resolve, reject) => {
        try {
            let opts = mongodb_helper_1.parseRequestById(settings, connections, schema, odataUri);
            mongodb_promises_1.connectAndCache(opts.connetionString, connections, function (err, connection) {
                if (err)
                    return reject(err);
                let db = connection.db;
                db.collection(opts.collectionName, function (ex, collection) {
                    if (ex)
                        return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                    collection.find(opts.primaryKey).toArray(function (ex, docs) {
                        if (ex)
                            return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                        if (!docs.length) {
                            return mongodb_helper_1.rejectAndClose(connection, reject, notFound());
                        }
                        let old = docs[0];
                        //id = old[propertyName];
                        let ov = putils.utils.value(old, opts.propertyName);
                        if (!ov)
                            return mongodb_helper_1.rejectAndClose(connection, reject, notFound());
                        try {
                            let bucket = _bucket(db, opts.prefix);
                            bucket.find({ _id: ov }, { batchSize: 1 }).toArray(function (err, files) {
                                if (err)
                                    return mongodb_helper_1.rejectAndClose(connection, reject, err);
                                if (files && files.length) {
                                    let file = files[0];
                                    if (res) {
                                        let downStream = bucket.openDownloadStream(ov);
                                        let ct = file.contentType || '';
                                        let attachement = (ct.indexOf('image/') !== 0 && ct.indexOf('video/') !== 0);
                                        if (attachement)
                                            res.setHeader('Content-disposition', 'attachment; filename=' + file.filename);
                                        else
                                            res.setHeader('Content-type', ct);
                                        return downStream.pipe(res).
                                            on('error', function (error) {
                                            return mongodb_helper_1.rejectAndClose(connection, reject, error);
                                        }).
                                            on('finish', function () {
                                            return mongodb_helper_1.resolveAndClose(connection, resolve);
                                        });
                                    }
                                    else {
                                        return mongodb_helper_1.resolveAndClose(connection, resolve);
                                    }
                                }
                                else {
                                    return mongodb_helper_1.rejectAndClose(connection, reject, notFound());
                                }
                            });
                        }
                        catch (ex) {
                            return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                        }
                    });
                });
            });
        }
        catch (ex) {
            reject(ex);
        }
    });
}
exports.downloadBinaryProperty = downloadBinaryProperty;
function uploadStream(db, schema, prefix, fileName, contentType, stream, tenantId, cb) {
    try {
        let bucket = _bucket(db, prefix);
        if (schema && schema.multiTenant) {
            if (!tenantId) {
                return cb(new putils.http.HttpError("Tenant id is empty.", 400), null);
            }
        }
        //Set the reference yto parent entity
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
