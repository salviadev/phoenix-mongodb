"use strict";

import * as mongodb  from 'mongodb';
import * as podata  from 'phoenix-odata';
import {extractOdataResult}  from './mongodb-result';

function _executeQuery(collection: mongodb.Collection, filter, options, cb: mongodb.MongoCallback<any>): void {
    if (!options.limit) options.limit = 100;
    if (options.group) {
        let pipeline = [];
        pipeline.push({ $match: filter });
        pipeline.push({ $group: options.group });
        if (options.havingFilter)
            pipeline.push({ $match: options.havingFilter });
        if (options.sort)
            pipeline.push({ $sort: options.sort });
        if (options.skip)
            pipeline.push({ $skip: options.skip });
        if (options.limit)
            pipeline.push({ $limit: options.limit });
        collection.aggregate(pipeline, cb);
    } else {
        let cursor = collection.find(filter);
        if (options.sort)
            cursor = cursor.sort(options.sort);
        if (options.skip)
            cursor = cursor.skip(options.skip);
        if (options.limit)
            cursor = cursor.limit(options.limit);
        cursor.toArray(cb);
    }
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
    if (options.text) {
        let keys = Object.keys(filter);
        if (!keys.length || filter.$and || filter.$or || filter.$where) {
            filter.$text = options.text;
        } else {
            filter = { $and: [filter], $text: options.text };
        }
    }
    return new Promise<any>((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function(ex, db) {
            if (ex) return reject(ex);
            db.collection(collectionName, function(ex, collection) {
                if (ex) return rejectAndClose(db, reject, ex);
                let count;
                _executeQuery(collection, filter, options, function(ex, docs: any[]) {
                    docs = extractOdataResult(docs || [], schema, options);
                    if (options.limit) {
                        if (docs.length < options.limit) {
                            if (options.count) {
                                options.count = false;
                                count = (options.skip || 0) + docs.length;
                            }
                        } else
                            docs.pop();
                    }
                    if (options.count) {
                        _executeQueryCount(collection, filter, options, function(ex, totalCount) {
                            if (ex) return rejectAndClose(db, reject, ex);
                            count = totalCount;
                            resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                        });

                    } else
                        resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                });

            });
        });

    });
}


export function execOdataQueryId(connetionString: string, collectionName: string, schema, primaryKey: any, options: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        mongodb.MongoClient.connect(connetionString, function(ex, db) {
            if (ex) return reject(ex);
            db.collection(collectionName, function(ex, collection) {
                if (ex) return rejectAndClose(db, reject, ex);
                let count;
                collection.find(primaryKey).limit(1).toArray(function(ex, docs: any[]) {
                    if (!docs || !docs.length) {
                        return rejectAndClose(db, reject, { message: "Document not found.", status: 404 });
                    }
                    return resolveAndClose(db, resolve, extractOdataResult(docs[0], schema, options));

                });
            });
        });

    });
}