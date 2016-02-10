/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function createDatabase(db: mongodb.Db, schemas: any[]): Promise<void>;
export declare function importCollectionFromStream(db: mongodb.Db, schema: any, stream: stream.Readable, insertMode: boolean, tenantId?: number): Promise<void>;
export declare function importCollectionFromFile(db: mongodb.Db, schema: any, file: string, insertMode: boolean, tenantId?: number): Promise<void>;
