"use strict";

import * as mongodb from 'mongodb';
import * as stream  from 'stream';
import * as fs from 'fs';
import * as JSONStream from 'JSONStream';


import * as mongoStream from './mongo-stream';


export function importCollectionFromStream(collection: mongodb.Collection, schema: any, stream: stream.Readable, override: boolean, tenantId?: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {

        let handleError = function(err): void {
            reject(err);
        };
        let handleSuccess = function(): void {
            resolve();
        }
        try {
            let ms = new mongoStream.MongoDbWriteStream(schema, override, tenantId || 0,  collection);
            let parser = JSONStream.parse('*');
            ms = stream.pipe(parser).pipe(ms);
            stream.on('error', handleError);
            stream.on('error', handleError);
            parser.on('error', handleError);
            ms.on('error', handleError);
            ms.on('finish', handleSuccess);
        } catch (ex) {
            handleError(ex);
        }
    });
}

export function importCollectionFromFile(collection: mongodb.Collection, schema: any, file: string, override: boolean, tenantId?: number): Promise<void> {
    let stream = fs.createReadStream(file, {
        encoding: 'utf8'
    });
    return importCollectionFromStream(collection, schema, stream, override, tenantId)

}