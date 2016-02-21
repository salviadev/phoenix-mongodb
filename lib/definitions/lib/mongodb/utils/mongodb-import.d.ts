import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, options?: {
    truncate: boolean;
    onImported: any;
}, tenantId?: number): Promise<number>;
