"use strict";

import * as mongodb  from 'mongodb';
import * as util  from 'util';
import * as podata  from 'phoenix-odata';
import * as putils  from 'phoenix-utils';
import {mongoDbUri}   from './mongodb-connection';
import {connectAndCache}   from './mongodb-promises';
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


function rejectAndClose(connection: { db: mongodb.Db, cache: boolean }, reject: (reason?: any) => void, reason?: any) {
    if (connection.cache)
        return reject(reason);
    connection.db.close(true, function(ex) {
        reject(reason);
    });
}

function resolveAndClose(connection: { db: mongodb.Db, cache: boolean }, resolve: (data?: any) => void, data?: any) {
    if (connection.cache)
        return resolve(data);
    connection.db.close(true, function(ex) {
        resolve(data);
    });
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

        let prefix = '';
        let propertyName = odataUri.propertyName;
        let collectionName = schema.name;
        let tenantId = parseInt(odataUri.query.tenantId, 10) || 0;
        let csettings = putils.utils.clone(settings, true);
        let options = { select: podata.parseSelect(odataUri.query.$select), application: odataUri.application, entity: odataUri.entity };
        let primaryKey = podata.checkAndParseEntityId(odataUri, schema);

        switch (schema.multiTenant) {
            case putils.multitenant.SHARE:
                //Add tenant Id to filter
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

        let connetionString = mongoDbUri(settings);
        return new Promise<any>((resolve, reject) => {
            connectAndCache(connetionString, connections, function(ex, connection) {
                let db = connection.db;
                if (ex) return reject(ex);
                db.collection(collectionName, function(ex, collection) {
                    if (ex) return rejectAndClose(connection, reject, ex);
                    let count;
                    collection.find(primaryKey).limit(1).toArray(function(ex, docs: any[]) {
                        if (!docs || !docs.length) {
                            return rejectAndClose(connection, reject, { message: "Document not found.", status: 404 });
                        }
                        let sitem = extractOdataResult(docs[0], schema, options);
                        if (propertyName) {
                            return resolveAndClose(connection, resolve, putils.utils.value(sitem, propertyName));
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


