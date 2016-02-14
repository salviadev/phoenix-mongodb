"use strict";

export function extractOdataResult(docs: any, schema: any, options: any) {
    if (Array.isArray(docs)) {
        return docs.map(function(item) {
            delete item._id;
            return item;
        });
    } else {
        delete docs._id;
        return docs;
    }
} 