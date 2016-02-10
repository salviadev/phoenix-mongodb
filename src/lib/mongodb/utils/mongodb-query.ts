/// <reference path="../../../../node_modules/phoenix-utils/lib/definitions/phoenix-utils.d.ts" />
"use strict";


import * as mongodb  from 'mongodb';
import {odata}  from 'phoenix-utils';
import * as mongodbp  from './mongo-promises';

function _executeQuery(collection: mongodb.Collection, filter, options, cb: mongodb.MongoCallback<any>): void {
    let cursor = collection.find(filter);
    if (options.sort)
        cursor = cursor.sort(options.sort);
    if (options.skip)
        cursor = cursor.skip(options.skip);
    if (options.limit)
        cursor = cursor.skip(options.limit);
    cursor.toArray(cb);
}


function _executeQueryCount(collection: mongodb.Collection, filter, options, callback: (err, count) => void): void {
    let cursor = collection.find(filter);
    cursor.count(false, null, callback);
}


export function execOdataQuery(db: mongodb.Db, collectionName: string, schema, filter: any, options: any): Promise<any> {

    return new Promise<any>((resolve, reject) => {
        db.collection(collectionName, function(ex, collection) {
            if (ex) return reject(ex);
            let count;
            if (options.count) {
                _executeQueryCount(collection, filter, options, function(ex, totalCount) {
                    if (ex) return reject(ex);
                    count = totalCount;
                    _executeQuery(collection, filter, options, function(ex, docs) {
                        resolve( { value:  docs || []});

                    });
                });

            } else {
                 _executeQuery(collection, filter, options, function(ex, docs) {
                      resolve( { value:  docs || []});
                 });
            }
        });

    });

}