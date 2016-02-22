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
var JSONStream = require('JSONStream');
var mongoStream = require('./mongodb-stream');
var csv = require('fast-csv');
function importCollectionFromStream(db, collection, schema, stream, options, tenantId) {
    options = options || { truncate: true, onImported: null };
    let isCsv = options.format === 'csv';
    return new Promise((resolve, reject) => {
        let handleError = function (err) {
            reject(err);
        };
        try {
            let ms = new mongoStream.MongoDbWriteStream(schema, options.truncate, tenantId || 0, db, collection);
            let parser = isCsv ? csv({ delimiter: ';' }) : JSONStream.parse('*');
            if (isCsv) {
                parser.on("data", function (data) {
                    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
                    console.log(data);
                });
            }
            ms = stream.pipe(parser).pipe(ms);
            stream.on('error', handleError);
            stream.on('error', handleError);
            parser.on('error', handleError);
            ms.on('error', handleError);
            ms.on('finish', function () {
                if (options.onImported)
                    options.onImported(schema, ms.count);
                resolve(ms.count);
            });
        }
        catch (ex) {
            handleError(ex);
        }
    });
}
exports.importCollectionFromStream = importCollectionFromStream;
