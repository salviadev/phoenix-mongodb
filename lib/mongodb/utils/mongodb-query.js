"use strict";
const mongodb = require('mongodb');
const util = require('util');
const podata = require('phoenix-odata');
const putils = require('phoenix-utils');
const mongodb_connection_1 = require('./mongodb-connection');
const mongodb_result_1 = require('./mongodb-result');
function _executeQuery(collection, filter, options, cb, addCount) {
    if (!options.limit)
        options.limit = 100;
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
    }
    else {
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
function _executeQueryCount(collection, filter, options, callback) {
    if (options.group) {
        _executeQuery(collection, filter, options, function (ex, docs) {
            if (ex)
                return callback(ex, 0);
            callback(null, (docs && docs.length ? docs[0].count : 0));
        }, true);
    }
    else {
        let cursor = collection.find(filter);
        cursor.count(false, null, callback);
    }
}
function rejectAndClose(db, reject, reason) {
    db.close(true, function (ex) {
        reject(reason);
    });
}
function resolveAndClose(db, resolve, data) {
    db.close(true, function (ex) {
        resolve(data);
    });
}
function execOdataQuery(settings, connections, schema, odataUri) {
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
            }
            else {
                filter = { $and: [filter], $text: options.text };
            }
        }
        let connetionString = mongodb_connection_1.mongoDbUri(csettings);
        return new Promise((resolve, reject) => {
            mongodb.MongoClient.connect(connetionString, function (ex, db) {
                if (ex)
                    return reject(ex);
                db.collection(collectionName, function (ex, collection) {
                    if (ex)
                        return rejectAndClose(db, reject, ex);
                    let count;
                    _executeQuery(collection, filter, options, function (ex, docs) {
                        docs = mongodb_result_1.extractOdataResult(docs || [], schema, options);
                        if (options.limit) {
                            if (docs.length < options.limit) {
                                if (options.count) {
                                    options.count = false;
                                    count = (options.skip || 0) + docs.length;
                                }
                            }
                            else
                                docs.pop();
                        }
                        if (options.count) {
                            _executeQueryCount(collection, filter, options, function (ex, totalCount) {
                                if (ex)
                                    return rejectAndClose(db, reject, ex);
                                count = totalCount;
                                resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                            });
                        }
                        else
                            resolveAndClose(db, resolve, podata.queryResult(docs || [], count));
                    }, false);
                });
            });
        });
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}
exports.execOdataQuery = execOdataQuery;
function execOdataQueryId(settings, connections, schema, odataUri) {
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
        let connetionString = mongodb_connection_1.mongoDbUri(settings);
        return new Promise((resolve, reject) => {
            mongodb.MongoClient.connect(connetionString, function (ex, db) {
                if (ex)
                    return reject(ex);
                db.collection(collectionName, function (ex, collection) {
                    if (ex)
                        return rejectAndClose(db, reject, ex);
                    let count;
                    collection.find(primaryKey).limit(1).toArray(function (ex, docs) {
                        if (!docs || !docs.length) {
                            return rejectAndClose(db, reject, { message: "Document not found.", status: 404 });
                        }
                        let sitem = mongodb_result_1.extractOdataResult(docs[0], schema, options);
                        if (propertyName) {
                            return resolveAndClose(db, resolve, putils.utils.value(sitem, propertyName));
                        }
                        else
                            return resolveAndClose(db, resolve, sitem);
                    });
                });
            });
        });
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}
exports.execOdataQueryId = execOdataQueryId;
