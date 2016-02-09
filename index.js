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
var connection_1 = require('./lib/mongodb/connection');
var mongodbSchema = require('./lib/mongodb/schema');
var dbpromises = require('./lib/mongodb/utils/mongo-promises');
exports.db = {
    connectionString: connection_1.connectionString,
    connect: dbpromises.connect,
    close: dbpromises.close
};
exports.schema = {
    createDatabase: mongodbSchema.createDatabase,
    importCollectionFromFile: mongodbSchema.importCollectionFromFile,
    importCollectionFromStream: mongodbSchema.importCollectionFromStream
};
