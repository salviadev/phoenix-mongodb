"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var stream = require('stream');
var pschema = require('phoenix-json-schema-tools');
var putils = require('phoenix-utils');
var mongodb_utils_1 = require('./mongodb-utils');
var mongodb_serialize_1 = require('./mongodb-serialize');
var mongodb_binary_1 = require('./mongodb-binary');
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
        this._blobs = pschema.schema.fieldsByType(schema, 'binary');
        this.count = 0;
    }
    _afterInsert(callback) {
        this.count++;
        callback();
    }
    _write(chunk, encoding, callback) {
        let that = this;
        try {
            if (that._schema.multiTenant && that._tenantId)
                chunk.tenantId = that._tenantId;
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
                                    let nv = putils.utils.value(chunk, data.value);
                                    if (v !== nv) {
                                        removeBlobs.push(mongodb_binary_1.removeFileByIdPromise(that._db, v));
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
