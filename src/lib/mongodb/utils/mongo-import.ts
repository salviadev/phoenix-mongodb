"use strict";

import * as mongodb from 'mongodb';
import * as stream  from 'stream';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';


import * as mongoStream from './mongo-stream';


export function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, insertMode: boolean, tenantId?: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {

        let handleError = function(err): void {
            reject(err);
        };
        try {
            let ms = new mongoStream.MongoDbWriteStream(schema, insertMode, tenantId || 0,  collection);
            let parser = JSONStream.parse('*');
            ms = stream.pipe(parser).pipe(ms);
            stream.on('error', handleError);
            stream.on('error', handleError);
            parser.on('error', handleError);
            ms.on('error', handleError);
            ms.on('finish', function(){
                resolve(ms.count);
            });
        } catch (ex) {
            handleError(ex);
        }
    });
}

export function importCollectionFromFile(collection: mongodb.Collection, schema: any, file: string, insertMode: boolean, tenantId?: number): Promise<number> {
    let stream = fs.createReadStream(file, {
        encoding: 'utf8'
    });
    return importCollectionFromStream(collection, schema, stream, insertMode, tenantId)

}