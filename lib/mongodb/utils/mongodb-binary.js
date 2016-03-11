"use strict";
const putils = require('phoenix-utils');
const podata = require('phoenix-odata');
var mongodb = require('mongodb');
const mongodb_connection_1 = require('./mongodb-connection');
const mongodb_promises_1 = require('./mongodb-promises');
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
function _closeAndCb(ex, connection, cb) {
    if (connection.cache)
        return cb(ex);
    connection.db.close(true, function (err) {
        cb(ex);
    });
}
;
//Upload a file 
// In the parent binary property set the "id" of file
// In the file (fs.files) metadata set the reference yto parent entity
function uploadBinaryProperty(settings, connections, schema, odataUri, fileName, contentType, stream, cb) {
    try {
        let propertyName = odataUri.propertyName;
        let prefix = '';
        let collectionName = schema.name;
        let tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);
        let csettings = putils.utils.clone(settings, true);
        switch (schema.multiTenant) {
            case putils.multitenant.SHARE:
                primaryKey.tenantId = tenantId;
                break;
            case putils.multitenant.SCHEMA:
                prefix = putils.multitenant.schemaPrefix(tenantId, 'mongodb');
                collectionName = putils.multitenant.collectionName(tenantId, schema.name, 'mongodb');
                break;
            case putils.multitenant.DB:
                csettings.database = putils.multitenant.databaseName(tenantId, csettings.databasePrefix, 'mongodb');
                break;
        }
        let uri = mongodb_connection_1.mongoDbUri(csettings);
        mongodb_promises_1.connectAndCache(uri, connections, function (err, connection) {
            if (err)
                return cb(err);
            let db = connection.db;
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return _closeAndCb(ex, connection, cb);
                collection.find(primaryKey).toArray(function (ex, docs) {
                    if (ex)
                        return _closeAndCb(ex, connection, cb);
                    if (!docs.length) {
                        return _closeAndCb(notFound(), connection, cb);
                    }
                    let old = docs[0];
                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (ov) {
                        return removeFileById(db, old[propertyName], prefix, function (err) {
                            if (err)
                                return _closeAndCb(err, connection, cb);
                            return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function (err, id) {
                                if (err)
                                    return _closeAndCb(err, connection, cb);
                                //old[propertyName] = id;
                                putils.utils.setValue(old, propertyName, id);
                                return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                    if (err)
                                        return _closeAndCb(err, connection, cb);
                                    _closeAndCb(null, connection, cb);
                                });
                            });
                        });
                    }
                    else {
                        return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function (err, id) {
                            if (err)
                                return _closeAndCb(err, connection, cb);
                            //old[propertyName] = id;
                            putils.utils.setValue(old, propertyName, id);
                            return collection.findOneAndUpdate({ _id: old._id }, old, function (err) {
                                if (err)
                                    return _closeAndCb(err, connection, cb);
                                _closeAndCb(null, connection, cb);
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
        let prefix = '';
        let collectionName = schema.name;
        let tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);
        let csettings = putils.utils.clone(settings, true);
        switch (schema.multiTenant) {
            case putils.multitenant.SHARE:
                primaryKey.tenantId = tenantId;
                break;
            case putils.multitenant.SCHEMA:
                prefix = putils.multitenant.schemaPrefix(tenantId, 'mongodb');
                collectionName = putils.multitenant.collectionName(tenantId, schema.name, 'mongodb');
                break;
            case putils.multitenant.DB:
                csettings.database = putils.multitenant.databaseName(tenantId, csettings.databasePrefix, 'mongodb');
                break;
        }
        let uri = mongodb_connection_1.mongoDbUri(csettings);
        mongodb_promises_1.connectAndCache(uri, connections, function (err, connection) {
            if (err)
                return cb(err);
            let db = connection.db;
            db.collection(collectionName, function (ex, collection) {
                if (ex)
                    return _closeAndCb(ex, connection, cb);
                collection.find(primaryKey).toArray(function (ex, docs) {
                    if (ex)
                        return _closeAndCb(ex, connection, cb);
                    if (!docs.length) {
                        return _closeAndCb(notFound(), connection, cb);
                    }
                    let old = docs[0];
                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (!ov) {
                        if (res)
                            res.status(200).json(null);
                        return _closeAndCb(null, connection, cb);
                    }
                    try {
                        let bucket = _bucket(db, prefix);
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
                                    _closeAndCb(error, connection, cb);
                                }).
                                    on('finish', function () {
                                    _closeAndCb(null, connection, cb);
                                });
                            }
                            else {
                                if (res)
                                    res.status(200).json(null);
                                return _closeAndCb(null, connection, cb);
                            }
                        });
                    }
                    catch (ex) {
                        return _closeAndCb(ex, connection, cb);
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
