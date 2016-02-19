"use strict";

import * as putils from 'phoenix-utils';
var mongodb = require('mongodb');


export function uploadStream(db: any, schema: any, fileName: string, stream: any, tenantId: number, cb: (ex: any, id: any) => void) {
    try {
        let bucket = new mongodb.GridFSBucket(db, { bucketName: "fs" });
        if (schema && schema.multiTenant) {
            if (!tenantId) {
                return cb(new putils.http.HttpError("Tenant id is empty.", 400), null);
            }
        }
        let options = {
            metadata: { tenantId: tenantId || 0, parent: schema ? schema.name : '' }
        };
        let uploadStream = bucket.openUploadStream(fileName, options);
        stream.pipe(bucket.openUploadStream(fileName, options)).
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

