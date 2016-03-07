"use strict";
const pschema = require('phoenix-json-schema-tools');
const putils = require('phoenix-utils');
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
