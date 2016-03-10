
/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />

"use strict";


import * as mongodb from 'mongodb';

import * as stream from 'stream';
import * as fs from 'fs';
import * as jsonSchema  from 'phoenix-json-schema-tools';
import * as putils  from 'phoenix-utils';

import * as podata  from 'phoenix-odata';
import {mongoDbUri}   from './utils/mongodb-connection';
import * as dbSchema from './utils/mongodb-schema';
import * as mongodbp  from './utils/mongodb-promises';
import * as mongodbImport  from './utils/mongodb-import';

async function createCollection(db: mongodb.Db, schema: any): Promise<void> {
    await jsonSchema.schema.checkSchema(schema);
    let indexes = jsonSchema.schema.indexesOfSchema(schema, true);
    let collection = await dbSchema.db.createCollection(db, schema.name);
    await dbSchema.collection.createIndexes(collection, indexes, schema.multiTenent);
}

export async function createCollections(connectionUri: string, schemas: any[]): Promise<void> {
    let db = await mongodbp.connect(connectionUri);
    try {
        await dbSchema.db.dropCollections(db);
        let p = schemas.map(function(schema) {
            return createCollection(db, schema);
        });

        await Promise.all<void>(p);
    } finally {
        await mongodbp.close(db);
    }

}

export async function importCollectionFromStream(settings: any, connections: any, schema: any, stream: stream.Readable, options?: { truncate: boolean, onImported: any, format?: string }, tenantId?: number): Promise<void> {
    let csettings = putils.utils.clone(settings, true);
    let connectionUri = mongoDbUri(csettings);
    let connection = await mongodbp.connectAndCachePromise(connectionUri, connections);
    try {
        let collections = await dbSchema.db.getCollections(connection.db);
        let names = collections.map(collection => {
            return collection.collectionName;
        });
        let isNew = false;
        if (names.indexOf(schema.name) < 0) {
            // collection not found create it.
            await createCollection(connection.db, schema);
            isNew = false;
        }
        let collection = await mongodbp.collection(connection.db, schema.name);
        if (!isNew && options.truncate) {
            await dbSchema.db.clearCollection(connection.db, collection, schema, tenantId || 0);
        }
        await mongodbImport.importCollectionFromStream(connection.db, collection, schema, stream, options, tenantId);
    } finally {
        if (!connection.cache)
            await mongodbp.close(connection.db);
    }
}


export async function importCollectionFromFile(settings: any, connections: any, schema: any, file: string, options?: { truncate: boolean, onImported: any, format?: string }, tenantId?: number): Promise<void> {
    let stream = fs.createReadStream(file, {
        encoding: 'utf8'
    });
    await importCollectionFromStream(settings, connections, schema, stream, options, tenantId);
}