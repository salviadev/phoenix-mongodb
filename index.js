"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var mongodbConnection = require('./lib/mongodb/connection');
var mongodbSchema = require('./lib/mongodb/schema');
var mongodb_binary_1 = require('./lib/mongodb/utils/mongodb-binary');
var mongodb_query_1 = require('./lib/mongodb/utils/mongodb-query');
exports.db = {
    connectionString: mongodbConnection.connectionString
};
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
    execQueryId: mongodb_query_1.execOdataQueryId
};
