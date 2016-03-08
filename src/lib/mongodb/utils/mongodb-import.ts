"use strict";

import * as mongodb from 'mongodb';
import * as stream  from 'stream';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as mongoStream from './mongodb-stream';
var csv = require('fast-csv');



export function importCollectionFromStream(db: mongodb.Db, collection: mongodb.Collection, schema: any, stream: stream.Readable, options?: { truncate: boolean, onImported: any, format?: string }, tenantId?: number): Promise<number> {
    options = options || { truncate: true, onImported: null };
    let isCsv = options.format === 'csv';
    return new Promise<number>((resolve, reject) => {

        let handleError = function(err): void {
            reject(err);
        };
        try {
            let ms = new mongoStream.MongoDbWriteStream(schema, options.truncate, tenantId || 0, db, collection);
            let parser = isCsv ? csv({ delimiter: ';', headers:true }) : JSONStream.parse('*');
            ms = stream.pipe(parser).pipe(ms);
            stream.on('error', handleError);
            parser.on('error', handleError);
            ms.on('error', handleError);
            ms.on('finish', function() {
                if (options.onImported)
                    options.onImported(schema, ms.count);
                resolve(ms.count);
            });
        } catch (ex) {
            handleError(ex);
        }
    });
}

