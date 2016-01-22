"use strict";

import * as stream  from 'stream';
import * as mongodb  from 'mongodb';
import * as mongodbp  from './mongo-promises';

export class MongoDbWriteStream extends stream.Writable {
    private _collection: mongodb.Collection;
    private _schema: any;
    public count: number;


    constructor(schema: any, collection: mongodb.Collection) {
        super({
            objectMode: true,
            highWaterMark: 16
        });
        this._schema = schema;
        this._collection = collection;
        this.count = 0;
    }
    private _afterInsert(callback: Function): void {
        this.count++;
        callback();
    }
    public _write(chunk: any, encoding: string, callback: Function): void {
        try {

            if (!this._collection)
                mongodbp.insert(this._collection, chunk).then(function(result) { }).catch(function(error) { this.emit('error', error); });
            else
                this._afterInsert(callback);

        } catch (error) {
            this.emit('error', error);

        }
    }
}
