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
var mongodbp = require('./mongo-promises');
class MongoDbWriteStream extends stream.Writable {
    constructor(schema, collection) {
        super({
            objectMode: true,
            highWaterMark: 16
        });
        this._schema = schema;
        this._collection = collection;
        this.count = 0;
    }
    _afterInsert(callback) {
        this.count++;
        callback();
    }
    _write(chunk, encoding, callback) {
        try {
            if (!this._collection)
                mongodbp.insert(this._collection, chunk).then(function (result) { }).catch(function (error) { this.emit('error', error); });
            else
                this._afterInsert(callback);
        }
        catch (error) {
            this.emit('error', error);
        }
    }
}
exports.MongoDbWriteStream = MongoDbWriteStream;
