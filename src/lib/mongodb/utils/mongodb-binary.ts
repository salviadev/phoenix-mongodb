"use strict";

import * as putils from 'phoenix-utils';
import * as podata from 'phoenix-odata';


var mongodb = require('mongodb');
import {mongoDbUri}   from './mongodb-connection';


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
export function removeFilesByParent(db: any, parent: string, schemaPrefix:string, tenantId: number, cb: (ex: any) => void) {
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
        mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) return cb(err);
            let closeAndCb = function(ex: any) {
                db.close(true, function(err) {
                    cb(ex);
                });
            };
            db.collection(collectionName, function(ex, collection) {
                if (ex) return closeAndCb(ex);
                collection.find(primaryKey).toArray(function(ex, docs) {
                    if (ex) return closeAndCb(ex);
                    if (!docs.length) {
                        return closeAndCb(notFound());
                    }
                    let old = docs[0];

                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (ov) {
                        return removeFileById(db, old[propertyName], prefix, function(err) {
                            if (err) return closeAndCb(err);
                            return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function(err, id) {
                                if (err) return closeAndCb(err);
                                //old[propertyName] = id;
                                putils.utils.setValue(old, propertyName, id);
                                return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                    if (err) return closeAndCb(err);
                                    closeAndCb(null);
                                });

                            });
                        });
                    } else {
                        return uploadStream(db, schema, prefix, fileName, contentType, stream, primaryKey.tenantId, function(err, id) {
                            if (err) return closeAndCb(err);
                            //old[propertyName] = id;
                            putils.utils.setValue(old, propertyName, id);
                            return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                if (err) return closeAndCb(err);
                                closeAndCb(null);
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

        mongodb.MongoClient.connect(uri, function(err, db) {
            if (err) return cb(err);
            let closeAndCb = function(ex: any) {
                db.close(true, function(err) {
                    cb(ex);
                });
            };
            db.collection(collectionName, function(ex, collection) {
                if (ex) return closeAndCb(ex);
                collection.find(primaryKey).toArray(function(ex, docs) {
                    if (ex) return closeAndCb(ex);
                    if (!docs.length) {
                        return closeAndCb(notFound());
                    }
                    let old = docs[0];
                    //id = old[propertyName];
                    let ov = putils.utils.value(old, propertyName);
                    if (!ov)
                        return closeAndCb(notFound());
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
                                        closeAndCb(error);
                                    }).
                                    on('finish', function() {
                                        closeAndCb(null);
                                    });

                            }
                            return closeAndCb(notFound());
                        });

                    } catch (ex) {
                        return closeAndCb(ex);
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

