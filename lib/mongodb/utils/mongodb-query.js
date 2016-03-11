"use strict";
const util = require('util');
const podata = require('phoenix-odata');
const putils = require('phoenix-utils');
const pschema = require('phoenix-json-schema-tools');
const mongodb_connection_1 = require('./mongodb-connection');
const mongodb_promises_1 = require('./mongodb-promises');
const mongodb_result_1 = require('./mongodb-result');
const mongodb_helper_1 = require('./mongodb-helper');
const mongodb_binary_1 = require('./mongodb-binary');
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
            mongodb_promises_1.connectAndCache(connetionString, connections, function (ex, connection) {
                if (ex)
                    return reject(ex);
                let db = connection.db;
                db.collection(collectionName, function (ex, collection) {
                    if (ex)
                        return mongodb_helper_1.rejectAndClose(connection, reject, ex);
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
                                    return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                                count = totalCount;
                                mongodb_helper_1.resolveAndClose(connection, resolve, podata.queryResult(docs || [], count));
                            });
                        }
                        else
                            mongodb_helper_1.resolveAndClose(connection, resolve, podata.queryResult(docs || [], count));
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
        let opts = mongodb_helper_1.parseRequestById(settings, connections, schema, odataUri);
        return new Promise((resolve, reject) => {
            mongodb_promises_1.connectAndCache(opts.connetionString, connections, function (ex, connection) {
                let db = connection.db;
                if (ex)
                    return reject(ex);
                db.collection(opts.collectionName, function (ex, collection) {
                    if (ex)
                        return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                    let count;
                    collection.find(opts.primaryKey).limit(1).toArray(function (ex, docs) {
                        if (!docs || !docs.length) {
                            return mongodb_helper_1.rejectAndClose(connection, reject, { message: "Document not found.", status: 404 });
                        }
                        let sitem = mongodb_result_1.extractOdataResult(docs[0], schema, opts.options);
                        if (opts.propertyName) {
                            return mongodb_helper_1.resolveAndClose(connection, resolve, putils.utils.value(sitem, opts.propertyName));
                        }
                        else
                            return mongodb_helper_1.resolveAndClose(connection, resolve, sitem);
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
function execDelete(settings, connections, schema, odataUri) {
    try {
        let opts = mongodb_helper_1.parseRequestById(settings, connections, schema, odataUri);
        return new Promise((resolve, reject) => {
            mongodb_promises_1.connectAndCache(opts.connetionString, connections, function (ex, connection) {
                let db = connection.db;
                if (ex)
                    return reject(ex);
                db.collection(opts.collectionName, function (ex, collection) {
                    if (ex)
                        return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                    collection.findOneAndDelete(opts.primaryKey, function (ex, item) {
                        if (ex)
                            return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                        if (!item)
                            return mongodb_helper_1.resolveAndClose(connection, resolve, undefined);
                        let blobs = pschema.schema.fieldsByType(schema, 'binary');
                        let removeBlobs = [];
                        if (blobs && blobs.length) {
                            blobs.forEach(propName => {
                                let v = putils.utils.value(item.value, propName);
                                if (v) {
                                    removeBlobs.push(mongodb_binary_1.removeFileByIdPromise(db, v, opts.prefix));
                                }
                            });
                        }
                        Promise.all(removeBlobs).then(function (res) {
                            return mongodb_helper_1.resolveAndClose(connection, resolve, undefined);
                        }).catch(function (ex) {
                            return mongodb_helper_1.rejectAndClose(connection, reject, ex);
                        });
                    });
                });
            });
        });
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}
exports.execDelete = execDelete;
