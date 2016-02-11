/// <reference path="../../../../node_modules/phoenix-odata/lib/definitions/phoenix-odata.d.ts" />
"use strict";


import * as mongodb  from 'mongodb';
import * as odata  from 'phoenix-odata';

function _executeQuery(collection: mongodb.Collection, filter, options, cb: mongodb.MongoCallback<any>): void {
    let cursor = collection.find(filter);
    if (options.sort)
        cursor = cursor.sort(options.sort);
    if (options.skip)
        cursor = cursor.skip(options.skip);
    if (options.limit)
        cursor = cursor.limit(options.limit);
    cursor.toArray(cb);
}


function _executeQueryCount(collection: mongodb.Collection, filter, options, callback: (err, count) => void): void {
    let cursor = collection.find(filter);
    cursor.count(false, null, callback);
}
function rejectAndClose(db: mongodb.Db, reject: (reason?: any) => void, reason?: any) {
    db.close(true, function(ex) {
        reject(reason);
    });
}

function resolveAndClose(db: mongodb.Db, resolve: (data?: any) => void, data?: any) {
    db.close(true, function(ex) {
        resolve(data);
    });
}
export function execOdataQuery(connetionString: string, collectionName: string, schema, filter: any, options: any): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function(ex, db) {
            if (ex) return reject(ex);
            db.collection(collectionName, function(ex, collection) {
                if (ex) return rejectAndClose(db, reject, ex);
                let count;
                if (options.count) {
                    _executeQueryCount(collection, filter, options, function(ex, totalCount) {
                        if (ex) return rejectAndClose(db, reject, ex);
                        count = totalCount;
                        _executeQuery(collection, filter, options, function(ex, docs) {
                            resolveAndClose(db, resolve, { value: docs || [] });

                        });
                    });

                } else {
                    _executeQuery(collection, filter, options, function(ex, docs) {
                        if (ex) return rejectAndClose(db, reject, ex);
                        resolveAndClose(db, resolve, { value: docs || [] });
                    });
                }
            });
        });

    });

}