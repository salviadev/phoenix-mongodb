"use strict";

import * as putils from 'phoenix-utils';
import * as podata from 'phoenix-odata';


var mongodb = require('mongodb');
import {mongoDbUri}   from './mongodb-connection';
import {connectAndCache}   from './mongodb-promises';
import {parseRequestById, resolveAndClose, rejectAndClose}  from './mongodb-helper';

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


//Upload a file 
// In the parent binary property set the "id" of file
// In the file (fs.files) metadata set the reference yto parent entity
export function uploadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, fileName: string, contentType: string, stream: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {

            let opts = parseRequestById(settings, connections, schema, odataUri);
            connectAndCache(opts.connetionString, connections, function(err, connection) {
                if (err) return reject(err);
                let db = connection.db;

                db.collection(opts.collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);
                    collection.find(opts.primaryKey).toArray(function(ex, docs) {
                        if (ex) return rejectAndClose(connection, reject, ex);
                        if (!docs.length) {
                            return rejectAndClose(connection, reject, notFound());

                        }
                        let old = docs[0];

                        //id = old[propertyName];
                        let ov = putils.utils.value(old, opts.propertyName);
                        if (ov) {
                            return removeFileById(db, old[opts.propertyName], opts.prefix, function(err) {
                                if (err) return rejectAndClose(connection, reject, err);
                                return uploadStream(db, schema, opts.prefix, fileName, contentType, stream, opts.primaryKey.tenantId, function(err, id) {
                                    if (err) return rejectAndClose(connection, reject, err);
                                    //old[propertyName] = id;
                                    putils.utils.setValue(old, opts.propertyName, id);
                                    return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                        if (err) return rejectAndClose(connection, reject, err);
                                        return resolveAndClose(connection, resolve);

                                    });

                                });
                            });
                        } else {
                            return uploadStream(db, schema, opts.prefix, fileName, contentType, stream, opts.primaryKey.tenantId, function(err, id) {
                                if (err) return rejectAndClose(connection, reject, err);
                                //old[propertyName] = id;
                                putils.utils.setValue(old, opts.propertyName, id);
                                return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                    if (err) return rejectAndClose(connection, reject, err);
                                    return resolveAndClose(connection, resolve);
                                });

                            });

                        }
                    });
                });

            });
        } catch (ex) {
            reject(ex);
        }
    });
}


export function downloadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, res: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            let opts = parseRequestById(settings, connections, schema, odataUri);
            connectAndCache(opts.connetionString, connections, function(err, connection) {
                if (err) return reject(err);
                let db = connection.db;

                db.collection(opts.collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);
                    collection.find(opts.primaryKey).toArray(function(ex, docs) {
                        if (ex) return rejectAndClose(connection, reject, ex);
                        if (!docs.length) {
                            return rejectAndClose(connection, reject, notFound());
                        }
                        let old = docs[0];
                        //id = old[propertyName];
                        let ov = putils.utils.value(old, opts.propertyName);
                        if (!ov)
                            return rejectAndClose(connection, reject, notFound());
                        try {
                            let bucket = _bucket(db, opts.prefix);
                            bucket.find({ _id: ov }, { batchSize: 1 }).toArray(function(err, files) {
                                if (err) return rejectAndClose(connection, reject, err);
                                if (files && files.length) {
                                    let file = files[0];
                                    if (res) {
                                        let downStream = bucket.openDownloadStream(ov);
                                        let ct = file.contentType || '';
                                        let attachement = (ct.indexOf('image/') !== 0 && ct.indexOf('video/') !== 0);

                                        if (attachement)
                                            res.setHeader('Content-disposition', 'attachment; filename=' + file.filename)
                                        else
                                            res.setHeader('Content-type', ct);
                                        return downStream.pipe(res).
                                            on('error', function(error) {
                                                return rejectAndClose(connection, reject, error);
                                            }).
                                            on('finish', function() {
                                                return resolveAndClose(connection, resolve);
                                            });

                                    } else {
                                        return resolveAndClose(connection, resolve);
                                    }

                                } else {
                                    return rejectAndClose(connection, reject, notFound());
                                }

                            });

                        } catch (ex) {
                            return rejectAndClose(connection, reject, ex);
                        }

                    });
                });

            });
        } catch (ex) {
            reject(ex);
        }
    });
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

