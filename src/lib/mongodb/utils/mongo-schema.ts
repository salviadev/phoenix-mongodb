"use strict";

import * as mongodb from 'mongodb';


function _getCollections(db: mongodb.Db): Promise<mongodb.Collection[]> {
    return new Promise<mongodb.Collection[]>((resolve, reject) => {
        db.collections(function(err, collections) {
            if (err)
                reject(err);
            else
                resolve(collections);
        });
    });
}

function _dropCollection(db: mongodb.Db, collectionName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.dropCollection(collectionName, function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

async function _removeCollections(db: mongodb.Db, except?: string[]): Promise<void> {
    let collections = await _getCollections(db);
    let p = [];
    for (let i = 0, len = collections.length; i < len; i++) {
        let collection = collections[i];
        if (except && except.indexOf(collection.collectionName) >= 0)
            continue;
        p.push(_dropCollection(db, collection.collectionName));
    }
    await Promise.all<void>(p);
}

function _dropAllIndexes(db: mongodb.Db, collection: mongodb.Collection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        collection.dropIndexes(function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

function _createCollection(db: mongodb.Db, collectionName: string): Promise<mongodb.Collection> {
    return new Promise<mongodb.Collection>((resolve, reject) => {
        db.createCollection(collectionName, function(err, collection) {
            if (err)
                reject(err);
            else
                resolve(collection);
        });
    });
}


function _createIndex(collection: mongodb.Collection, indexFields: string, unique: boolean, multiTenant: boolean): Promise<void> {
    let fields = indexFields.split(",");
    let indexDesc: any = {};
    if (multiTenant)
        indexDesc.tenantId = 1; 
    fields.forEach(function(field) {
        let fields = field.trim().split(' ');
        if (fields.length > 1)
            indexDesc[fields[0]] = fields[2] === 'desc' ? -1 : 1;
        else
            indexDesc[fields[0]] = 1;
    });
    return new Promise<void>((resolve, reject) => {
        collection.createIndex(indexDesc, { unique: unique }, function(err, indexname) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

function _createTextIndex(collection: mongodb.Collection, indexFields: string): Promise<void> {
    let fields = indexFields.split(",");
    let indexDesc = {};
    fields.forEach(function(field) {
        let fields = field.trim().split(' ');
        indexDesc[fields[0]] = 'text';
    });
    return new Promise<void>((resolve, reject) => {
        collection.createIndex(indexDesc, {}, function(err, indexname) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}

async function _createIndexes(collection: mongodb.Collection, indexes: any[], multiTenant: boolean): Promise<void> {
    if (indexes && indexes.length) {
        let p = [];
        for (let indexDesc of indexes) {
            if (indexDesc.text)
                p.push(_createTextIndex(collection, indexDesc.fields));
            else
                p.push(_createIndex(collection, indexDesc.fields, indexDesc.unique, multiTenant));
        }
        await Promise.all<void>(p);
    }
}

export var db = {
    getCollections: _getCollections,
    dropCollections: _removeCollections,
    createCollection: _createCollection,
    dropCollection: _dropCollection
};

export var collection = {
    dropIndexes: _dropAllIndexes,
    createIndexes: _createIndexes
};