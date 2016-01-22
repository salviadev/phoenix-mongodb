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
var fs = require('fs');
var JSONStream = require('JSONStream');
var mongoStream = require('./mongo-stream');
function importCollectionFromStream(collection, schema, stream) {
    return new Promise((resolve, reject) => {
        let handleError = function (err) {
            reject(err);
        };
        let handleSuccess = function () {
            resolve();
        };
        let ms = new mongoStream.MongoDbWriteStream(schema, collection);
        let parser = JSONStream.parse('*');
        stream.pipe(parser).pipe(ms);
        stream.on('error', handleError);
        parser.on('error', handleError);
        ms.on('error', handleError);
        ms.on('finish', handleSuccess);
    });
}
exports.importCollectionFromStream = importCollectionFromStream;
function importCollectionFromFile(collection, schema, file) {
    let stream = fs.createReadStream(file, {
        encoding: 'utf8'
    });
    return importCollectionFromStream(collection, schema, stream);
}
exports.importCollectionFromFile = importCollectionFromFile;
