"use strict";

import * as mongodb from 'mongodb';
import * as stream from 'stream';

import * as mongodbConnection  from './lib/mongodb/connection';
import * as mongodbSchema  from './lib/mongodb/schema';
import * as dbpromises  from './lib/mongodb/utils/mongo-promises';
import {execOdataQuery}  from './lib/mongodb/utils/mongodb-query';

export var db = {
    connectionString: mongodbConnection.connectionString,
    connect: dbpromises.connect,
    close: dbpromises.close
};

export var schema = {
    createDatabase: mongodbSchema.createDatabase,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};

export var odata = {
    execQuery: execOdataQuery
};






