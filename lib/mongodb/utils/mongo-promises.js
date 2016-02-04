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
function insert(collection, value) {
    return new Promise((resolve, reject) => {
        collection.insertOne(value, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.insert = insert;
function collection(db, collectionName) {
    return new Promise((resolve, reject) => {
        db.collection(collectionName, function (err, result) {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
}
exports.collection = collection;
