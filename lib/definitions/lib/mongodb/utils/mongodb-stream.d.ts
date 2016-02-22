import * as stream from 'stream';
import * as mongodb from 'mongodb';
export declare class MongoDbWriteStream extends stream.Writable {
    private _collection;
    private _db;
    private _schema;
    private _insert;
    private _blobs;
    private _tenantId;
    count: number;
    constructor(schema: any, insertMode: boolean, tenantId: number, db: mongodb.Db, collection: mongodb.Collection);
    private _afterInsert(callback);
    _write(chunk: any, encoding: string, callback: Function): void;
}
