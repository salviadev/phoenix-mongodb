"use strict";
const podata = require('phoenix-odata');
const putils = require('phoenix-utils');
const mongodb_connection_1 = require('./mongodb-connection');
function parseRequestById(settings, connections, schema, odataUri) {
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
    let connetionString = mongodb_connection_1.mongoDbUri(csettings);
    return { primaryKey: primaryKey, propertyName: propertyName, connetionString: connetionString, options: options,
        collectionName: collectionName, prefix: prefix };
}
exports.parseRequestById = parseRequestById;
function rejectAndClose(connection, reject, reason) {
    if (connection.cache)
        return reject(reason);
    connection.db.close(true, function (ex) {
        reject(reason);
    });
}
exports.rejectAndClose = rejectAndClose;
function resolveAndClose(connection, resolve, data) {
    if (connection.cache)
        return resolve(data);
    connection.db.close(true, function (ex) {
        resolve(data);
    });
}
exports.resolveAndClose = resolveAndClose;
