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