import * as stream from 'stream';
import * as mongodb from 'mongodb';
export declare class MongoDbWriteStream extends stream.Writable {
    private _collection;
    private _schema;
    count: number;
    constructor(schema: any, collection: mongodb.Collection);
    private _afterInsert(callback);
    _write(chunk: any, encoding: string, callback: Function): void;
}
