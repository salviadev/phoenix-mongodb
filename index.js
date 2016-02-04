"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
__export(require('./lib/mongodb/connection'));
var dbpromises = require('./lib/mongodb/utils/mongo-promises');
exports.db = {
    connect: dbpromises.connect,
    close: dbpromises.close
};
