"use strict";

import * as stream  from 'stream';
import * as mongodb  from 'mongodb';
import * as pschema from 'phoenix-json-schema-tools';
import {primaryKeyFilter}  from './mongodb-utils';
import {deserializeFromJson}  from './mongodb-serialize';


//mongodb writable stream

export class MongoDbWriteStream extends stream.Writable {
    private _collection: mongodb.Collection;
    private _schema: any;
    private _insert: any;
    private _blobs: string[];
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
        this._blobs = pschema.schema.fieldsByType(schema, 'binary');
        this.count = 0;
    }
    private _afterInsert(callback: Function): void {
        this.count++;
        callback();
    }
    public _write(chunk: any, encoding: string, callback: Function): void {
        let that = this;
        try {
            if (this._schema.multiTenant && this._tenantId)
                chunk.tenantId = this._tenantId;
            deserializeFromJson(chunk, that._schema);
            if (that._collection) {
                if (that._insert) {
                    that._collection.insertOne(chunk, function(err, data) {
                        if (err)
                            callback(err);
                        else
                            that._afterInsert(callback);
                    });

                } else {
                    let pp = primaryKeyFilter(chunk, that._schema);
                    that._collection.findOneAndReplace(pp, chunk, { upsert: true }, function(err, data) {
                        if (data) {
                            console.log(data);
                        }
                        if (err)
                            callback(err);
                        else
                            that._afterInsert(callback);
                    });
                }
            } else
                that._afterInsert(callback);

        } catch (error) {
            callback(error);

        }
    }
}
