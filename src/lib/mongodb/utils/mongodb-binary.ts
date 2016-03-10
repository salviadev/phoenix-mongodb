"use strict";

import * as putils from 'phoenix-utils';
import * as podata from 'phoenix-odata';


var mongodb = require('mongodb');
import {mongoDbUri}   from './mongodb-connection';
import {connectAndCache}   from './mongodb-promises';


//get bucket name
function _bucket(db, prefix): any {
    return new mongodb.GridFSBucket(db, { bucketName: prefix + 'fs' });
}


// Remove a file by id
export function removeFileById(db: any, id: string, schemaPrefix: string, cb: (ex: any) => void) {
    let bucket = _bucket(db, schemaPrefix);
    bucket.find({ _id: id }, { batchSize: 1 }).toArray(function(err, files) {
        if (err) return cb(err);
        if (files && files.length) {
            return bucket.delete(id, function(err) {
                if (err) return cb(err);
                return cb(null);
            });

        }
        return cb(null);
    });
}

export function removeFileByIdPromise(db: any, id: string, schemaPrefix: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        removeFileById(db, id, schemaPrefix, function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}


// Remove all files that are referenced by an entity
export function removeFilesByParent(db: any, parent: string, schemaPrefix: string, tenantId: number, cb: (ex: any) => void) {
    let bucket = _bucket(db, schemaPrefix);
    bucket.find({ "metadata.tenantId": tenantId || 0, "metadata.parent": parent }, { batchSize: 1 }).toArray(function(err, files) {
        if (err) return cb(err);
        if (files && files.length) {
            let promises = [];
            files.forEach(function(file) {
                promises.push(bucket.delete(file._id));
            });
            Promise.all(promises).then(function() {
                cb(null);
            }).catch(function(ex) {
                cb(ex);
            });

        } else
            cb(null);
    });
}


function notFound(): any {
    return new putils.http.HttpError("Not found", 404);
}

function _closeAndCb(ex: any, connection, cb) {
    if (connection.cache) return cb(ex);
    connection.db.close(true, function(err) {
        cb(ex);
    });
};
//Upload a file 
// In the parent binary property set the "id" of file
// In the file (fs.files) metadata set the reference yto parent entity
export function uploadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, fileName: string, contentType: string, stream: any, cb: (ex: any) => void) {
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

        let uri = mongoDbUri(csettings);
        connectAndCache(uri, connections, function(err, connection) {
            if (err) return cb(err);
            let db = connection.db;

            db.collection(collectionName, function(ex, collection) {
                if (ex) return _closeAndCb(ex, connection, cb);
                collection.find(primaryKey).toArray(function(ex, docs) {
                    if (ex) return _closeAndCb(ex, connection, cb);
                    if (!docs.length) {
                        return _closeAndCb(notFound(), connection, cb);
                    }
                    let old = docs[0];

                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (ov) {
                        return removeFileById(db, old[propertyName], prefix, function(err) {
                            if (err) return _closeAndCb(err, connection, cb);
                            return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function(err, id) {
                                if (err) return _closeAndCb(err, connection, cb);
                                //old[propertyName] = id;
                                putils.utils.setValue(old, propertyName, id);
                                return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                    if (err) return _closeAndCb(err, connection, cb);
                                    _closeAndCb(null, connection, cb);

                                });

                            });
                        });
                    } else {
                        return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function(err, id) {
                            if (err) return _closeAndCb(err, connection, cb);
                            //old[propertyName] = id;
                            putils.utils.setValue(old, propertyName, id);
                            return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                if (err) return _closeAndCb(err, connection, cb);
                                _closeAndCb(null, connection, cb);
                            });

                        });

                    }
                });
            });

        });
    } catch (ex) {
        cb(ex);
    }
}


export function downloadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, res: any, cb: (ex: any) => void) {

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

        let uri = mongoDbUri(csettings);
        connectAndCache(uri, connections, function(err, connection) {
            if (err) return cb(err);
            let db = connection.db;

            db.collection(collectionName, function(ex, collection) {
                if (ex) return _closeAndCb(ex, connection, cb);
                collection.find(primaryKey).toArray(function(ex, docs) {
                    if (ex) return _closeAndCb(ex, connection, cb);
                    if (!docs.length) {
                        return _closeAndCb(notFound(), connection, cb);
                    }
                    let old = docs[0];
                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (!ov)
                        return _closeAndCb(notFound(), connection, cb);
                    try {
                        let bucket = _bucket(db, prefix);
                        bucket.find({ _id: ov }, { batchSize: 1 }).toArray(function(err, files) {
                            if (err) return cb(err);
                            if (files && files.length) {
                                let file = files[0];
                                let downStream = bucket.openDownloadStream(ov);
                                let ct = file.contentType || '';
                                let attachement = (ct.indexOf('image/') !== 0 && ct.indexOf('video/') !== 0);
                                if (attachement)
                                    res.setHeader('Content-disposition', 'attachment; filename=' + file.filename)
                                else
                                    res.setHeader('Content-type', ct);
                                return downStream.pipe(res).
                                    on('error', function(error) {
                                        _closeAndCb(error, connection, cb);
                                    }).
                                    on('finish', function() {
                                        _closeAndCb(null, connection, cb);
                                    });

                            }
                            return _closeAndCb(notFound(), connection, cb);
                        });

                    } catch (ex) {
                        return _closeAndCb(ex, connection, cb);
                    }

                });
            });

        });
    } catch (ex) {
        cb(ex);

    }
}



export function uploadStream(db: any, schema: any, prefix: string, fileName: string, contentType: string, stream: any, tenantId: number, cb: (ex: any, id: any) => void) {
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
            on('error', function(error) {
                cb(error, null);
            }).
            on('finish', function() {
                cb(null, uploadStream.id);
            });
    } catch (ex) {
        cb(ex, null);

    }
}

