"use strict";

import * as mongodb  from 'mongodb';
import * as podata  from 'phoenix-odata';
import * as putils  from 'phoenix-utils';
import {mongoDbUri}   from './mongodb-connection';


export function parseRequestById(settings: any, connections, schema: any, odataUri: podata.OdataParsedUri): 
{ primaryKey: any, propertyName: string, connetionString: string, options: any, collectionName: string, prefix: string } {
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

    let connetionString = mongoDbUri(csettings);
    return { primaryKey: primaryKey, propertyName: propertyName, connetionString: connetionString, options: options, 
        collectionName: collectionName, prefix: prefix};
}


export function rejectAndClose(connection: { db: mongodb.Db, cache: boolean }, reject: (reason?: any) => void, reason?: any) {
    if (connection.cache)
        return reject(reason);
    connection.db.close(true, function(ex) {
        reject(reason);
    });
}

export function resolveAndClose(connection: { db: mongodb.Db, cache: boolean }, resolve: (data?: any) => void, data?: any) {
    if (connection.cache)
        return resolve(data);
    connection.db.close(true, function(ex) {
        resolve(data);
    });
}
