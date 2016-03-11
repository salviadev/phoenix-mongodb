"use strict";

import * as mongodb  from 'mongodb';
import * as util  from 'util';
import * as podata  from 'phoenix-odata';
import * as putils  from 'phoenix-utils';
import * as pschema from 'phoenix-json-schema-tools';
import {mongoDbUri}   from './mongodb-connection';
import {connectAndCache}   from './mongodb-promises';
import {extractOdataResult}  from './mongodb-result';
import {parseRequestById, resolveAndClose, rejectAndClose}  from './mongodb-helper';
import {removeFileByIdPromise}  from './mongodb-binary';



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






export function execOdataQuery(settings: any, connections, schema: any, odataUri: podata.OdataParsedUri): Promise<any> {
    try {
        let sfilter = odataUri.query.$filter;

        let prefix = '';
        let collectionName = schema.name;
        let tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        let csettings = putils.utils.clone(settings, true);

        switch (schema.multiTenant) {
            case putils.multitenant.SHARE:
                //Add tenant Id to filter
                let tenantIdFilter = util.format('(tenantId  eq %d)', tenantId);
                if (sfilter)
                    sfilter = '(' + sfilter + ') and ' + tenantIdFilter;
                else
                    sfilter = tenantIdFilter;
                break;
            case putils.multitenant.SCHEMA:
                prefix = putils.multitenant.schemaPrefix(tenantId, 'mongodb');
                collectionName = putils.multitenant.collectionName(tenantId, schema.name, 'mongodb');
                break;
            case putils.multitenant.DB:
                csettings.database = putils.multitenant.databaseName(tenantId, csettings.databasePrefix, 'mongodb');
                break;
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

        let connetionString = mongoDbUri(csettings);

        return new Promise<any>((resolve, reject) => {
            connectAndCache(connetionString, connections, function(ex, connection) {
                if (ex) return reject(ex);
                let db = connection.db;
                db.collection(collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);
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
                                if (ex) return rejectAndClose(connection, reject, ex);
                                count = totalCount;
                                resolveAndClose(connection, resolve, podata.queryResult(docs || [], count));
                            });

                        } else
                            resolveAndClose(connection, resolve, podata.queryResult(docs || [], count));
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
        let opts = parseRequestById(settings, connections, schema, odataUri);
        return new Promise<any>((resolve, reject) => {
            connectAndCache(opts.connetionString, connections, function(ex, connection) {
                let db = connection.db;
                if (ex) return reject(ex);
                db.collection(opts.collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);
                    let count;
                    collection.find(opts.primaryKey).limit(1).toArray(function(ex, docs: any[]) {
                        if (!docs || !docs.length) {
                            return rejectAndClose(connection, reject, { message: "Document not found.", status: 404 });
                        }
                        let sitem = extractOdataResult(docs[0], schema, opts.options);
                        if (opts.propertyName) {
                            return resolveAndClose(connection, resolve, putils.utils.value(sitem, opts.propertyName));
                        } else
                            return resolveAndClose(connection, resolve, sitem);

                    });
                });
            });

        });
    } catch (ex) {
        return Promise.reject(ex);
    }
}


export function execDelete(settings: any, connections, schema: any, odataUri: podata.OdataParsedUri): Promise<void> {
    try {
        let opts = parseRequestById(settings, connections, schema, odataUri);
        return new Promise<void>((resolve, reject) => {
            connectAndCache(opts.connetionString, connections, function(ex, connection) {
                let db = connection.db;
                if (ex) return reject(ex);
                db.collection(opts.collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);


                    collection.findOneAndDelete(opts.primaryKey, function(ex, item) {
                        if (ex) return rejectAndClose(connection, reject, ex);
                        if (!item)
                            return resolveAndClose(connection, resolve, undefined);
                     
                        let blobs = pschema.schema.fieldsByType(schema, 'binary');
                        let removeBlobs = [];
                        if (blobs && blobs.length) {
                            blobs.forEach(propName => {
                                let v = putils.utils.value(item.value, propName);

                                if (v) {
                                    removeBlobs.push(removeFileByIdPromise(db, v, opts.prefix));
                                }
                            });

                        }
                        Promise.all(removeBlobs).then(function(res){
                            return resolveAndClose(connection, resolve, undefined);
                        }).catch(function(ex){
                            return rejectAndClose(connection, reject, ex);
                        })

                    });
                });
            });

        });
    } catch (ex) {
        return Promise.reject(ex);
    }
}


