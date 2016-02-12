
/// <reference path="../../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
/// <reference path="../../../../node_modules/phoenix-utils/lib/definitions/phoenix-utils.d.ts" />

"use strict";

import * as pschema  from 'phoenix-json-schema-tools';
import * as putils  from 'phoenix-utils';


export function deserializeFromJson(jsonObject: any, schema: any): void {
    pschema.schema.enumProps(jsonObject, schema, function(propName, type, cs: any, value: any) {
        if (type === 'date') {
            value[propName] = putils.date.parseISODate(value[propName]);
        }
    });
    
} 