"use strict";

import * as podata from 'phoenix-odata';

export function extractOdataResult(docs: any, schema: any, options: any) {
    if (Array.isArray(docs)) {
        return docs.map(function(item) {
            delete item._id;
           return podata.applySelect(item, options.select);
        });
    } else {
        delete docs._id;
        return podata.applySelect(docs, options.select);
    }
} 