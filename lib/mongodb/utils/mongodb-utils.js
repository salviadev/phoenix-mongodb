"use strict";
const pschema = require('phoenix-json-schema-tools');
const putils = require('phoenix-utils');
function primaryKeyFilter(value, schema) {
    let res = {};
    let pkFields = pschema.schema.pkFields(schema);
    pkFields.forEach(pn => {
        putils.utils.setValue(res, pn, putils.utils.value(value, pn));
    });
    if (schema.multiTenant === putils.multitenant.SHARE) {
        res.tenantId = value.tenantId;
    }
    return res;
}
exports.primaryKeyFilter = primaryKeyFilter;
