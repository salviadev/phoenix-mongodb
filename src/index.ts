"use strict";

import * as mongodb from 'mongodb';
import * as stream from 'stream';

import * as mongodbConnection  from './lib/mongodb/connection';
import * as mongodbSchema  from './lib/mongodb/schema';
import {uploadBinaryProperty, downloadBinaryProperty}  from './lib/mongodb/utils/mongodb-binary';

import {execOdataQuery, execOdataQueryId}  from './lib/mongodb/utils/mongodb-query';

export var db = {
    connectionString: mongodbConnection.connectionString
};

export var schema = {
    createCollections: mongodbSchema.createCollections,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};

export var upload = {
    uploadBinaryProperty: uploadBinaryProperty,
    downloadBinaryProperty: downloadBinaryProperty
};

export var odata = {
    execQuery: execOdataQuery,
    execQueryId: execOdataQueryId
};






