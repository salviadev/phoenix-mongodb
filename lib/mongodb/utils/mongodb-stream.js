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
var mongodb_serialize_1 = require('./mongodb-serialize');
class MongoDbWriteStream extends stream.Writable {
    constructor(schema, insertMode, tenantId, collection) {
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
    _afterInsert(callback) {
        this.count++;
        callback();
    }
    _write(chunk, encoding, callback) {
        let that = this;
        try {
            if (that._collection) {
                if (this._schema.multiTenant && this._tenantId)
                    chunk.tenantId = this._tenantId;
                mongodb_serialize_1.deserializeFromJson(chunk, that._schema);
                if (that._insert) {
                    that._collection.insertOne(chunk, function (err, data) {
                        if (err)
                            callback(err);
                        else
                            that._afterInsert(callback);
                    });
                }
                else {
                    // to do insert or update
                    that._afterInsert(callback);
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
