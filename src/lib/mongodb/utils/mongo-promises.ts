"use strict";

import * as mongodb from 'mongodb';

export function insert(collection: mongodb.Collection, value: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        collection.insert(value, function(err, result) {
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