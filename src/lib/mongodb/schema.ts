"use strict";

import * as mongodb from 'mongodb';

import * as stream from 'stream';
import * as jsonSchema  from 'phoenix-json-schema-tools';
import * as dbSchema from './utils/mongo-schema';
import * as mongodbp  from './utils/mongo-promises';
import * as mongodbImport  from './utils/mongo-import';

export async function createCollection(db: mongodb.Db, schema: any): Promise<void> {
    await jsonSchema.checkSchema(schema);
    let indexes = jsonSchema.indexesOfSchema(schema, true);
    let collection = await dbSchema.db.createCollection(db, schema.name);
    await dbSchema.collection.createIndexes(collection, indexes);
}


export async function createDatabase(db: mongodb.Db, schemas: any[]): Promise<void> {
    let p = schemas.map(function(schema) {
        return createCollection(db, schema);
    });
    await Promise.all<void>(p);

}

export async function createCollectionAndImportFromStream(db: mongodb.Db, schema: any, stream: stream.Readable): Promise<void> {
    await createCollection(db, schema);
    let collection = await mongodbp.collection(db, schema.name);
    mongodbImport.importCollectionFromStream(collection, schema, stream)
}

export async function createCollectionAndImportFile(db: mongodb.Db, schema: any, file: string): Promise<void> {
    await createCollection(db, schema);
    let collection = await mongodbp.collection(db, schema.name);
    await mongodbImport.importCollectionFromFile(collection, schema, file);
}

/*


var fs = require('fs'),
    path = require("path"),
    async = require('async'),
    JSONStream = require('JSONStream'),
    schemaUtils = require('./dbschemautils'),
    schemaCtrls = require('../utils/schema-validation'),
    json = require("../utils/json"),
    mongoStream = require('./mongo-write-stream');


async function _loadSchemaFromFiles(files, after) {
    let schemas = [];
    if (!files || !files.length) return schemas;

    async.each(files, function(file, callback) {
        json.loadFromFile(file, function(err, schema) {
            if (err) return callback(err);
            schemas.push(schema);
            callback(null);
        });

    }, function(err) {
        after(err, schemas);
    });
}










function _loadSchemaFromFolder(schemapath, after) {
    fs.readdir(schemapath, function(err, files) {
        if (err) return after(err, null);
        var jsonFiles = files.map(function(file) {
            return path.join(schemapath, file);

        }).filter(function(file) {
            return file.toLowerCase().indexOf(".json") > 0;
        });
        var fileList = [];
        async.each(jsonFiles, function(file, callback) {
            fs.stat(file, function(err, stats) {
                if (!err && stats.isFile())
                    fileList.push(file);
                callback(null);
            });

        }, function(err) {
            if (err)
                return after(err, null);
            _loadSchemaFromFiles(fileList, after);
        });

    });
};



function _createDatabaseCollections(db, schemapath, dataPath, cb, after) {
    _loadSchemaFromFolder(schemapath, function(err, schemas) {
        if (err) return after(err, null);
        schemaUtils.db.dropCollections(db, [], function(err, list) {
            if (err) return after(err, null);
            schemas = schemas || [];
            async.each(schemas, function(schema, callback) {
                createCollectionFromSchema(db, schema, function(err, collection) {
                    if (err) return callback(err);
                    if (dataPath) {
                        _importCollection(schema, collection, path.resolve(dataPath, schema.$name + '.json'), function(err) {
                            if (err)
                                return callback(err);
                            else
                                return callback(null);
                        }, cb);
                    } else
                        return callback(null);

                });

            }, function(err) {
                after(err, null);
            });


        });

    });
}





module.exports = {
    createCollection: _createCollection

};
*/