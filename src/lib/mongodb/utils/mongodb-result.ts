"use strict";

import * as podata from 'phoenix-odata';

export function extractOdataResult(docs: any, schema: any, options: any) {
    if (Array.isArray(docs)) {
        return docs.map(function(item) {
           return podata.extractResult(item, options);
        });
    } else {
        return podata.extractResult(docs, options);
    }
} 