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
var pschema = require('phoenix-json-schema-tools');
var putils = require('phoenix-utils');
// deserialize json *
// --> date string --> date object
// --> check numbers
function deserializeFromJson(jsonObject, schema) {
    pschema.schema.enumProps(jsonObject, schema, function (propName, type, cs, value) {
        if (type === 'date') {
            value[propName] = putils.date.parseISODate(value[propName]);
        }
        else if (type === 'number') {
            let p = value[propName] || 0;
            if (typeof p !== 'number') {
                value[propName] = parseFloat(p || '0');
            }
        }
    });
}
exports.deserializeFromJson = deserializeFromJson;
