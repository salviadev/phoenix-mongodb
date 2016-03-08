"use strict";
const JSONStream = require('JSONStream');
const mongoStream = require('./mongodb-stream');
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
            let parser = isCsv ? csv({ delimiter: ';', headers: true }) : JSONStream.parse('*');
            ms = stream.pipe(parser).pipe(ms);
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
