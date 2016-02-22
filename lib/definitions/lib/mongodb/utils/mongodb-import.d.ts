import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare function importCollectionFromStream(db: mongodb.Db, collection: mongodb.Collection, schema: any, stream: stream.Readable, options?: {
    truncate: boolean;
    onImported: any;
    format?: string;
}, tenantId?: number): Promise<number>;
