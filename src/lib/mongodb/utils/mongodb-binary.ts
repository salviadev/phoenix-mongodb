"use strict";

import * as putils from 'phoenix-utils';
var mongodb = require('mongodb');


function _bucket(db): any {
    return new mongodb.GridFSBucket(db, { bucketName: "fs" });
}


function removeFile(db: any, id: string, cb: (ex: any) => void) {
    let bucket = _bucket(db);
    bucket.find({ _id: id }, { batchSize: 1 }).toArray(function(err, files) {
        if (err) return cb(err);
        if (files && files.length) {
            bucket.delete(id, function(err) {
                if (err) return cb(err);
                return cb(null);
                return
            });

        }
        return cb(null);
    });
}



export function uploadBinaryProperty(uri: string, schema: any, pk: any, propertyName: string, fileName: string, contentType: string, stream: any, cb: (ex: any) => void) {
    mongodb.MongoClient.connect(uri, function(err, db) {
        if (err) return cb(err);
        let closeAndCb = function(ex: any) {
            db.close(true, function(err) {
                cb(ex);
            });
        };
        db.collection(schema.name, function(ex, collection) {
            if (ex) return closeAndCb(ex);
            collection.find(pk).toArray(function(ex, docs) {
                if (ex) return closeAndCb(ex);
                if (!docs.length) {
                    return closeAndCb(new putils.http.HttpError("Not found", 404));
                }
                let old = docs[0];
                if (old[propertyName]) {
                    removeFile(db, old[propertyName], function(err) {
                        if (err) return closeAndCb(err);
                        uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function(err, id) {
                            old[propertyName] = id;
                            collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                if (err) return closeAndCb(err);
                                closeAndCb(null);
                            });

                        });
                    });
                } else {
                    uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function(err, id) {
                        old[propertyName] = id;
                        collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                            if (err) return closeAndCb(err);
                            closeAndCb(null);
                        });

                    });

                }
            });
        });

    });
}


export function uploadStream(db: any, schema: any, fileName: string, contentType: string, stream: any, tenantId: number, cb: (ex: any, id: any) => void) {
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

