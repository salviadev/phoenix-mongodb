"use strict";
const podata = require('phoenix-odata');
function extractOdataResult(docs, schema, options) {
    if (Array.isArray(docs)) {
        return docs.map(function (item) {
            return podata.mongodb.extractResult(item, options);
        });
    }
    else {
        return podata.mongodb.extractResult(docs, options);
    }
}
exports.extractOdataResult = extractOdataResult;
