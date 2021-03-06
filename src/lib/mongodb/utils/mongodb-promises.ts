"use strict";

import * as mongodb from 'mongodb';


export function connectAndCache(uri: string, connections: any, cb: (err, res: { db: mongodb.Db, cache: boolean }) => void) {
    if (connections && connections[uri]) {
        return cb(null, { db: connections[uri], cache: true });

    }
    mongodb.MongoClient.connect(uri, function(err, result) {
        if (err)
            return cb(err, null);
        else {
            var cache = false;
            if (connections && !connections[uri]) {
                connections[uri] = result;
                cache = true;
            }
            return cb(err, { db: result, cache: cache });
        }
    });

}

export function connectAndCachePromise(uri: string, connections: any): Promise<{ db: mongodb.Db, cache: boolean }> {
    return new Promise<{ db: mongodb.Db, cache: boolean }>((resolve, reject) => {
        connectAndCache(uri, connections, function(err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}


export function insert(collection: mongodb.Collection, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        collection.insertOne(value, function(err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
export function collection(db: mongodb.Db, collectionName: string): Promise<mongodb.Collection> {

    return new Promise<mongodb.Collection>((resolve, reject) => {
        db.collection(collectionName, function(err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}


export function connect(uri: string): Promise<mongodb.Db> {
    return new Promise<mongodb.Db>((resolve, reject) => {
        mongodb.MongoClient.connect(uri, function(err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}

export function close(db: mongodb.Db): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.close(true, function(err) {
            resolve();
        });
    });
}