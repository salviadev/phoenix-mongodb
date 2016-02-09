"use strict";
import * as mongodb from 'mongodb';
import * as stream from 'stream';

import  {connectionString}  from './lib/mongodb/connection';
import *  as mongodbSchema  from './lib/mongodb/schema';

import *  as dbpromises  from './lib/mongodb/utils/mongo-promises';



export var db = {
    connectionString: connectionString,
    connect: dbpromises.connect,
    close: dbpromises.close
};

export var schema = {
    createDatabase: mongodbSchema.createDatabase,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};


