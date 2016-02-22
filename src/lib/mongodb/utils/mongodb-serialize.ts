"use strict";

import * as pschema  from 'phoenix-json-schema-tools';
import * as putils  from 'phoenix-utils';

// deserialize json *
// --> date string --> date object
// --> check numbers
export function deserializeFromJson(jsonObject: any, schema: any): void {
    pschema.schema.enumProps(jsonObject, schema, function(propName, type, cs: any, value: any) {
        if (type === 'date') {
            value[propName] = putils.date.parseISODate(value[propName]);
        } else if (type === 'number') {
            let p =  value[propName] || 0;
            if (typeof p !== 'number') {
                 value[propName] = parseFloat(p || '0');
            }
        }
    });
    
} 