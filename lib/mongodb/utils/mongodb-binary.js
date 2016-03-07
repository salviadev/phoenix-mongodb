"use strict";
const putils = require('phoenix-utils');
const podata = require('phoenix-odata');
var mongodb = require('mongodb');
const mongodb_connection_1 = require('./mongodb-connection');
//get bucket name
function _bucket(db) {
    return new mongodb.GridFSBucket(db, { bucketName: "fs" });
}
// Remove a file by id
function removeFileById(db, id, cb) {
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
exports.removeFileById = removeFileById;
function removeFileByIdPromise(db, id) {
    return new Promise((resolve, reject) => {
        removeFileById(db, id, function (err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
exports.removeFileByIdPromise = removeFileByIdPromise;
// Remove all files that are referenced by an entity
function removeFilesByParent(db, parent, tenantId, cb) {
    let bucket = _bucket(db);
    bucket.find({ "metadata.tenantId": tenantId || 0, "metadata.parent": parent }, { batchSize: 1 }).toArray(function (err, files) {
        if (err)
            return cb(err);
        if (files && files.length) {
            let promises = [];
            files.forEach(function (file) {
                promises.push(bucket.delete(file.id));
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
function uploadBinaryProperty(settings, connections, schema, odataUri, fileName, contentType, stream, cb) {
    try {
        let propertyName = odataUri.propertyName;
        let prefix = '';
        let collectionName = schema.name;
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);
        if (schema.multiTenant === 'shared') {
            primaryKey.tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        }
        else if (schema.multiTenant == 'schema') {
        }
        else if (schema.multiTenant == 'db') {
        }
        let uri = mongodb_connection_1.mongoDbUri(settings);
        mongodb.MongoClient.connect(uri, function (err, db) {
            if (err)
                return cb(err);
            let closeAndCb = function (ex) {
                db.close(true, function (err) {
                    cb(ex);
                });
            };
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return closeAndCb(ex);
                collection.find(primaryKey).toArray(function (ex, docs) {
                    if (ex)
                        return closeAndCb(ex);
                    if (!docs.length) {
                        return closeAndCb(notFound());
                    }
                    let old = docs[0];
                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (ov) {
                        return removeFileById(db, old[propertyName], function (err) {
                            if (err)
                                return closeAndCb(err);
                            return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function (err, id) {
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
                        return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function (err, id) {
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
    catch (ex) {
        cb(ex);
    }
}
exports.uploadBinaryProperty = uploadBinaryProperty;
function downloadBinaryProperty(settings, connections, schema, odataUri, res, cb) {
    try {
        let propertyName = odataUri.propertyName;
        let collectionName = schema.name;
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);
        if (schema.multiTenant === 'shared') {
            primaryKey.tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        }
        else if (schema.multiTenant == 'schema') {
        }
        else if (schema.multiTenant == 'db') {
        }
        let uri = mongodb_connection_1.mongoDbUri(settings);
        mongodb.MongoClient.connect(uri, function (err, db) {
            if (err)
                return cb(err);
            let closeAndCb = function (ex) {
                db.close(true, function (err) {
                    cb(ex);
                });
            };
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return closeAndCb(ex);
                collection.find(primaryKey).toArray(function (ex, docs) {
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
    catch (ex) {
        cb(ex);
    }
}
exports.downloadBinaryProperty = downloadBinaryProperty;
//TODO multitenant
function uploadStream(db, schema, prefix, fileName, contentType, stream, tenantId, cb) {
    try {
        let bucket = _bucket(db);
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
