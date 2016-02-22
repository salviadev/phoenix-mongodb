"use strict";

import * as mongodb from 'mongodb';
import * as stream  from 'stream';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as mongoStream from './mongodb-stream';


export function importCollectionFromStream(db: mongodb.Db,  collection: mongodb.Collection, schema: any, stream: stream.Readable, options?: {truncate: boolean, onImported: any}, tenantId?: number): Promise<number> {
        options = options || {truncate: true, onImported: null};
        return new Promise<number>((resolve, reject) => {

            let handleError = function(err): void {
                reject(err);
            };
            try {
                let ms = new mongoStream.MongoDbWriteStream(schema, options.truncate, tenantId || 0, db, collection);
                let parser = JSONStream.parse('*');
                ms = stream.pipe(parser).pipe(ms);
                stream.on('error', handleError);
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

