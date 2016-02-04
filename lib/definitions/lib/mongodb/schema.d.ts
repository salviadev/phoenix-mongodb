/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function createCollection(db: mongodb.Db, schema: any): Promise<void>;
export declare function createDatabase(db: mongodb.Db, schemas: any[]): Promise<void>;
export declare function createCollectionAndImportFromStream(db: mongodb.Db, schema: any, stream: stream.Readable): Promise<void>;
export declare function createCollectionAndImportFile(db: mongodb.Db, schema: any, file: string): Promise<void>;
