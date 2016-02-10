import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, insertMode: boolean, tenantId?: number): Promise<number>;
export declare function importCollectionFromFile(collection: mongodb.Collection, schema: any, file: string, insertMode: boolean, tenantId?: number): Promise<number>;
