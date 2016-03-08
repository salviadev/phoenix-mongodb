"use strict";
const stream = require('stream');
const pschema = require('phoenix-json-schema-tools');
const putils = require('phoenix-utils');
const mongodb_utils_1 = require('./mongodb-utils');
const mongodb_serialize_1 = require('./mongodb-serialize');
const mongodb_binary_1 = require('./mongodb-binary');
//mongodb writable stream
class MongoDbWriteStream extends stream.Writable {
    constructor(schema, insertMode, tenantId, db, collection) {
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
    _afterInsert(callback) {
        this.count++;
        callback();
    }
    _write(chunk, encoding, callback) {
        let that = this;
        let prefix = '';
        try {
            if (that._schema.multiTenant === putils.multitenant.SHARE)
                chunk.tenantId = that._tenantId;
            else if (that._schema.multiTenant === putils.multitenant.SCHEMA)
                prefix = putils.multitenant.schemaPrefix(that._tenantId, 'mongodb');
            mongodb_serialize_1.deserializeFromJson(chunk, that._schema);
            if (that._collection) {
                if (that._insert) {
                    that._collection.insertOne(chunk, function (err, data) {
                        if (err)
                            callback(err);
                        else
                            that._afterInsert(callback);
                    });
                }
                else {
                    let pp = mongodb_utils_1.primaryKeyFilter(chunk, that._schema);
                    that._collection.findOneAndReplace(pp, chunk, { upsert: true }, function (err, data) {
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
                                        removeBlobs.push(mongodb_binary_1.removeFileByIdPromise(that._db, v, prefix));
                                    }
                                });
                            }
                        }
                        if (removeBlobs.length) {
                            Promise.all(removeBlobs).then(function () {
                                that._afterInsert(callback);
                            }).catch(function (err) {
                                return callback(err);
                            });
                            return;
                        }
                        that._afterInsert(callback);
                    });
                }
            }
            else
                that._afterInsert(callback);
        }
        catch (error) {
            callback(error);
        }
    }
}
exports.MongoDbWriteStream = MongoDbWriteStream;
