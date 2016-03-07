"use strict";

import * as mongodb  from 'mongodb';
import * as util  from 'util';
import * as podata  from 'phoenix-odata';
import * as putils  from 'phoenix-utils';
import {mongoDbUri}   from './mongodb-connection';
import {extractOdataResult}  from './mongodb-result';

function _executeQuery(collection: mongodb.Collection, filter, options, cb: mongodb.MongoCallback<any>, addCount: boolean): void {
    if (!options.limit) options.limit = 100;
    if (options.group) {
        let pipeline = [];
        pipeline.push({ $match: filter });
        pipeline.push({ $group: options.group });
        if (options.havingFilter)
            pipeline.push({ $match: options.havingFilter });
        if (!addCount && options.sort)
            pipeline.push({ $sort: options.sort });
        if (!addCount && options.skip)
            pipeline.push({ $skip: options.skip });
        if (!addCount && options.limit)
            pipeline.push({ $limit: options.limit });
        if (addCount) {
            pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
        }

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

    if (options.group) {
        _executeQuery(collection, filter, options, function(ex, docs) {
            if (ex) return callback(ex, 0);
            callback(null, (docs && docs.length ? docs[0].count : 0));

        }, true);
    } else {
        let cursor = collection.find(filter);
        cursor.count(false, null, callback);
    }
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



export function execOdataQuery(settings: any, connections, schema: any, odataUri: podata.OdataParsedUri): Promise<any> {
    try {
        let collectionName = schema.name;
        let sfilter = odataUri.query.$filter;
        // addtenant id
        if (schema.multiTenant === 'shared') {
            //Add tenant Id to filter
            let tenantIdFilter = util.format('(tenantId  eq %s)', odataUri.query.tenantId);
            if (sfilter)
                sfilter = '(' + sfilter + ') and ' + tenantIdFilter;
            else
                sfilter = tenantIdFilter;
        } else if (schema.multiTenant == 'schema') {
            //tenantId to  schema name
            //prefix collectionName with schema
            //collectionName = 
        } else if (schema.multiTenant == 'db') {
            // tenantId 2 database name

        }

        let options = podata.mongodb.queryOptions(odataUri.query, schema);
        options.application = odataUri.application;
        options.entity = odataUri.entity;
        let filter = podata.mongodb.parseFilter(sfilter, schema, options);
        options.select = podata.parseSelect(odataUri.query.$select);
        if (options.text) {
            let keys = Object.keys(filter);
            if (!keys.length || filter.$and || filter.$or || filter.$where) {
                filter.$text = options.text;
            } else {
                filter = { $and: [filter], $text: options.text };
            }
        }

        let connetionString = mongoDbUri(settings);

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
                    }, false);

                });
            });

        });
    } catch (ex) {
        return Promise.reject(ex);

    }
}



export function execOdataQueryId(settings: any, connections, schema: any, odataUri: podata.OdataParsedUri): Promise<any> {
    try {
        let propertyName = odataUri.propertyName;
        let collectionName = schema.name;
        let options = { select: podata.parseSelect(odataUri.query.$select), application: odataUri.application, entity: odataUri.entity };
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);
        if (schema.multiTenant === 'shared') {
            primaryKey.tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        } else if (schema.multiTenant == 'schema') {
            //tenantId to  schema name
            //prefix collectionName with schema
            //collectionName = 
        } else if (schema.multiTenant == 'db') {
            // tenantId 2 database name

        }
        let connetionString = mongoDbUri(settings);
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
                        let sitem = extractOdataResult(docs[0], schema, options);
                        if (propertyName) {
                            return resolveAndClose(db, resolve, putils.utils.value(sitem, propertyName));
                        } else
                            return resolveAndClose(db, resolve, sitem);

                    });
                });
            });

        });
    } catch (ex) {
        return Promise.reject(ex);
    }
}


