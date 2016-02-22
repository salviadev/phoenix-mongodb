"use strict";

import * as stream  from 'stream';
import * as mongodb  from 'mongodb';
import * as pschema from 'phoenix-json-schema-tools';
import * as putils from 'phoenix-utils';
import {primaryKeyFilter}  from './mongodb-utils';
import {deserializeFromJson}  from './mongodb-serialize';
import {removeFileByIdPromise}  from './mongodb-binary';


//mongodb writable stream

export class MongoDbWriteStream extends stream.Writable {
    private _collection: mongodb.Collection;
    private _db: mongodb.Db;
    private _schema: any;
    private _insert: any;
    private _blobs: string[];
    private _tenantId: number;
    public count: number;


    constructor(schema: any, insertMode: boolean, tenantId: number, db: mongodb.Db, collection: mongodb.Collection) {
        super({
            objectMode: true,
            highWaterMark: 16
        });
        this._schema = schema;
        this._tenantId = tenantId;
        this._collection = collection;
        this._insert = insertMode;
        this._db = db;
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
            if (that._schema.multiTenant && that._tenantId)
                chunk.tenantId = that._tenantId;
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
                        if (err)
                            return callback(err);
                        let removeBlobs = [];
                        if (data && data.value) {
                            //data.value --> is old value
                            // remove files
                            if (that._blobs.length) {
                                that._blobs.forEach(propName => {
                                    let v = putils.utils.value(data.value, propName);
                                    let nv = putils.utils.value(chunk, propName);
                                    if (v !== nv) {
                                        removeBlobs.push(removeFileByIdPromise(that._db, v));
                                    }
                                });

                            }

                        }
                        if (removeBlobs.length) {
                            Promise.all(removeBlobs).then(function() {
                                that._afterInsert(callback);
                            }).catch(function(err) {
                                return callback(err);
                            });
                            return;
                        }

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
