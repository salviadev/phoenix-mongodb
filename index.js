"use strict";
const mongodbSchema = require('./lib/mongodb/schema');
const mongodb_binary_1 = require('./lib/mongodb/utils/mongodb-binary');
const mongodb_query_1 = require('./lib/mongodb/utils/mongodb-query');
exports.schema = {
    createCollections: mongodbSchema.createCollections,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};
exports.upload = {
    uploadBinaryProperty: mongodb_binary_1.uploadBinaryProperty,
    downloadBinaryProperty: mongodb_binary_1.downloadBinaryProperty
};
exports.odata = {
    execQuery: mongodb_query_1.execOdataQuery,
    execQueryId: mongodb_query_1.execOdataQueryId,
    execDelete: mongodb_query_1.execDelete
};
