
/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />

"use strict";


import * as mongodb from 'mongodb';

import * as stream from 'stream';
import * as fs from 'fs';
import * as jsonSchema  from 'phoenix-json-schema-tools';
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

export async function importCollectionFromStream(connectionUri: string, schema: any, stream: stream.Readable, options?: {truncate: boolean, onImported: any}, tenantId?: number): Promise<void> {
    let db = await mongodbp.connect(connectionUri);
    try {
        let collections = await dbSchema.db.getCollections(db);
        let names = collections.map(collection => {
            return collection.collectionName;
        });
        let isNew = false;
        if (names.indexOf(schema.name) < 0) {
            // collection not found create it.
            await createCollection(db, schema);
            isNew = false;
        }
        let collection = await mongodbp.collection(db, schema.name);
        if (!isNew && options.truncate) {
            await dbSchema.db.clearCollection(db, collection, schema, tenantId || 0);
        }
        await mongodbImport.importCollectionFromStream(db, collection, schema, stream, options, tenantId);
    } finally {
        await mongodbp.close(db);
    }
}


export async function importCollectionFromFile(connectionUri: string, schema: any, file: string, options?: {truncate: boolean, onImported: any}, tenantId?: number): Promise<void> {
    let stream = fs.createReadStream(file, {
        encoding: 'utf8'
    });
    await importCollectionFromStream(connectionUri, schema, stream, options, tenantId);
}