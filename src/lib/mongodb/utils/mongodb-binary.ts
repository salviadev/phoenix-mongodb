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
            return bucket.delete(id, function(err) {
                if (err) return cb(err);
                return cb(null);
            });

        }
        return cb(null);
    });
}
function notFound(): any {
    return new putils.http.HttpError("Not found", 404);
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
                    return closeAndCb(notFound());
                }
                let old = docs[0];
                
                //id = old[propertyName];
                let ov = putils.utils.value(old, propertyName);
                if (ov) {
                    return removeFile(db, old[propertyName], function(err) {
                        if (err) return closeAndCb(err);
                        return uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function(err, id) {
                            if (err) return closeAndCb(err);
                            //old[propertyName] = id;
                            putils.utils.setValue(old, propertyName, id);
                            old[propertyName] = id;
                            return collection.findOneAndUpdate({ _id: old._id }, old, function(err) {
                                if (err) return closeAndCb(err);
                                closeAndCb(null);
                            });

                        });
                    });
                } else {
                    return uploadStream(db, schema, fileName, contentType, stream, pk.tenantId, function(err, id) {
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
}

export function downloadBinaryProperty(uri: string, schema: any, pk: any, propertyName: string, res: any, cb: (ex: any) => void) {
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

