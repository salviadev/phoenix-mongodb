"use strict";

import * as mongodb from 'mongodb';
import * as stream from 'stream';

import * as mongodbConnection  from './lib/mongodb/connection';
import * as mongodbSchema  from './lib/mongodb/schema';
import {execOdataQuery}  from './lib/mongodb/utils/mongodb-query';

export var db = {
    connectionString: mongodbConnection.connectionString
};

export var schema = {
    createCollections: mongodbSchema.createCollections,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};

export var odata = {
    execQuery: execOdataQuery
};






