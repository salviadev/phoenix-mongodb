/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />

"use strict";

import * as mongodb from 'mongodb';

import * as stream from 'stream';
import * as jsonSchema  from 'phoenix-json-schema-tools';
import * as dbSchema from './utils/mongo-schema';
import * as mongodbp  from './utils/mongo-promises';
import * as mongodbImport  from './utils/mongo-import';

async function createCollection(db: mongodb.Db, schema: any): Promise<void> {
    await jsonSchema.checkSchema(schema);
    let indexes = jsonSchema.indexesOfSchema(schema, true);
    let collection = await dbSchema.db.createCollection(db, schema.name);
    await dbSchema.collection.createIndexes(collection, indexes, schema.multiTenent);
}


export async function createDatabase(db: mongodb.Db, schemas: any[]): Promise<void> {
    await dbSchema.db.dropCollections(db);
    let p = schemas.map(function(schema) {
        return createCollection(db, schema);
    });
    await Promise.all<void>(p);

}

export async function importCollectionFromStream(db: mongodb.Db, schema: any, stream: stream.Readable, options?: any, tenantId?: number): Promise<void> {
    let collections = await dbSchema.db.getCollections(db);
    let names = collections.map(collection => {
        return collection.collectionName;
    });
    let isNew = false;
    if (names.indexOf(schema.name) < 0) {
        await createCollection(db, schema);
        isNew = false;
    }
    let collection = await mongodbp.collection(db, schema.name);
    if (!isNew && isNew) {
        //todo remove all records 
    }
    await mongodbImport.importCollectionFromStream(collection, schema, stream, options, tenantId)
}

export async function importCollectionFromFile(db: mongodb.Db, schema: any, file: string, options?: any, tenantId?: number): Promise<void> {
    let collections = await dbSchema.db.getCollections(db);
    let names = collections.map(collection => {
        return collection.collectionName;
    });
    let isNew = false;
    if (names.indexOf(schema.name) < 0) {
        await createCollection(db, schema);
        isNew = false;
    }
    let collection = await mongodbp.collection(db, schema.name);
    if (!isNew && isNew) {
        //todo remove all records
    }
    await mongodbImport.importCollectionFromFile(collection, schema, file, options, tenantId);
}