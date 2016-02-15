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
var podata = require('phoenix-odata');
function extractOdataResult(docs, schema, options) {
    if (Array.isArray(docs)) {
        return docs.map(function (item) {
            delete item._id;
            return podata.applySelect(item, options.select);
        });
    }
    else {
        delete docs._id;
        return podata.applySelect(docs, options.select);
    }
}
exports.extractOdataResult = extractOdataResult;
