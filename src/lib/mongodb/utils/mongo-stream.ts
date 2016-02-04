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
        let that = this;
        try {
            if (that._collection)
                mongodbp.insert(that._collection, chunk).then(function(result) { 
                     that._afterInsert(callback);
                }).catch(function(error) { 
                    callback(error); 
                });
            else
                that._afterInsert(callback);

        } catch (error) {
           callback(error); 

        }
    }
}
