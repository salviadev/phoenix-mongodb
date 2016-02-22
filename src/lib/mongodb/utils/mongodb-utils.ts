"use strict";

import * as mongodb  from 'mongodb';
import * as pschema from 'phoenix-json-schema-tools';
import * as putils from 'phoenix-utils';

export function primaryKeyFilter(value: any, schema: any): any {
    let res: any = {};

    let pkFields = pschema.schema.pkFields(schema);
    pkFields.forEach(pn => {
        putils.utils.setValue(res, pn, putils.utils.value(value, pn));
    });
    if (schema.multiTenant) {
        res.tenantId = value.tenantId;
    }
    return res;
}

