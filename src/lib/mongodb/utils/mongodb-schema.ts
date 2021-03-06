"use strict";

import * as mongodb from 'mongodb';
import * as pschema from 'phoenix-json-schema-tools';
import * as putils from 'phoenix-utils';
import * as mbinary from './mongodb-binary';

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
        if (collection.collectionName.indexOf('system.') === 0)
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

function _clearCollection(db: mongodb.Db, collection: mongodb.Collection, schema: any, tenantId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        let hasBinaryFields = pschema.schema.fieldsByType(schema, 'binary').length > 0;
        let promises = [];
        let filter: any = {};
        let prefix = '';
        if (schema.multiTenant === putils.multitenant.SHARE) filter.tenantId = tenantId;
        else if (schema.multiTenant === putils.multitenant.SCHEMA) prefix = putils.multitenant.schemaPrefix(tenantId, 'mongodb');
        if (hasBinaryFields) {
             return mbinary.removeFilesByParent(db, schema.name, prefix, filter.tenantId || 0, function(ex) {
                if (ex) return reject(ex);
                return collection.deleteMany(filter, function(error, result) {
                    if (error)
                        return reject(error);
                    resolve();
                });

            });

        } else
            return collection.deleteMany(filter, function(error, result) {
                if (error)
                    return reject(error);
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


function _getIndexDesc(collection: mongodb.Collection, indexFields: string, unique: boolean, multiTenant: string): any {
    let fields = indexFields.split(',');
    let indexDesc: any = {};
    if (multiTenant === putils.multitenant.SHARE)
        indexDesc.tenantId = 1;
    fields.forEach(function(field) {
        let fields = field.trim().split(' ');
        if (fields.length > 1)
            indexDesc[fields[0]] = fields[2] === 'desc' ? -1 : 1;
        else
            indexDesc[fields[0]] = 1;
    });
    return {
        key: indexDesc,
        unique: unique
    };

}

function _getTextIndexDesc(collection: mongodb.Collection, indexFields: string): any {
    let fields = indexFields.split(",");
    let indexDesc = {};
    fields.forEach(function(field) {
        let fields = field.trim().split(' ');
        indexDesc[fields[0]] = 'text';
    });
    return {
        key: indexDesc
    };
}

function _createIndexes(collection: mongodb.Collection, indexes: any[], multiTenant: string): Promise<void> {
    if (indexes && indexes.length) {
        let p = [];
        for (let indexDesc of indexes) {
            if (indexDesc.text)
                p.push(_getTextIndexDesc(collection, indexDesc.fields));
            else
                p.push(_getIndexDesc(collection, indexDesc.fields, indexDesc.unique, multiTenant));
        }
        return collection.createIndexes(p);
    } else
        return Promise.resolve<void>(undefined);

}

export var db = {
    getCollections: _getCollections,
    dropCollections: _removeCollections,
    createCollection: _createCollection,
    clearCollection: _clearCollection, 
    dropCollection: _dropCollection
};

export var collection = {
    dropIndexes: _dropAllIndexes,
    createIndexes: _createIndexes
};