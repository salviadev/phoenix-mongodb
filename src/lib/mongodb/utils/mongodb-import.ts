"use strict";

import * as mongodb from 'mongodb';
import * as stream  from 'stream';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';
import * as mongoStream from './mongodb-stream';


export function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, options?: any, tenantId?: number): Promise<number> {
        options = options || {};
        return new Promise<number>((resolve, reject) => {

            let handleError = function(err): void {
                reject(err);
            };
            try {
                let ms = new mongoStream.MongoDbWriteStream(schema, options.insert, tenantId || 0, collection);
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

