"use strict";

import * as stream  from 'stream';
import * as mongodb  from 'mongodb';
import * as mongodbp  from './mongo-promises';

export class MongoDbWriteStream extends stream.Writable {
    private _collection: mongodb.Collection;
    private _schema: any;
    private _insert: any;
    private _tenantId: number;
    public count: number;


    constructor(schema: any, insertMode: boolean, tenantId: number, collection: mongodb.Collection) {
        super({
            objectMode: true,
            highWaterMark: 16
        });
        this._schema = schema;
        this._tenantId = tenantId;
        this._collection = collection;
        this._insert = insertMode;
        this.count = 0;
    }
    private _afterInsert(callback: Function): void {
        this.count++;
        callback();
    }
    public _write(chunk: any, encoding: string, callback: Function): void {
        let that = this;
        try {
            if (that._collection) {
                if (this._schema.multiTenant && this._tenantId)
                    chunk.tenantId = this._tenantId;

                if (that._insert) {
                    mongodbp.insert(that._collection, chunk).then(function(result) {
                        that._afterInsert(callback);
                    }).catch(function(error) {
                        callback(error);
                    });
                } else {
                    // to do insert or update
                    that._afterInsert(callback);
                }
            } else
                that._afterInsert(callback);

        } catch (error) {
            callback(error);

        }
    }
}
