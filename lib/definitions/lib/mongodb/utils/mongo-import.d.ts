import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, override: boolean, tenantId?: number): Promise<void>;
export declare function importCollectionFromFile(collection: mongodb.Collection, schema: any, file: string, override: boolean, tenantId?: number): Promise<void>;
