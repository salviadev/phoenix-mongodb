"use strict";
function mongoDbUri(configMongo) {
    configMongo = configMongo || {};
    configMongo.port = configMongo.port || 27017;
    configMongo.host = configMongo.host || 'localhost';
    var url = ['mongodb://'];
    if (configMongo.user) {
        url.push(configMongo.user);
        if (configMongo.password) {
            url.push(":");
            url.push(configMongo.password);
        }
        url.push('@');
    }
    url.push(configMongo.host);
    if (configMongo.port !== 27017)
        url.push(':' + configMongo.port);
    if (configMongo.database)
        url.push('/' + configMongo.database);
    if (configMongo.options) {
        var first = true;
        Object.keys(configMongo.options).forEach(function (v) {
            if (first)
                url.push('?');
            url.push(v + '=');
            url.push(encodeURIComponent(configMongo.options[v]));
            first = false;
        });
    }
    return url.join('');
}
exports.mongoDbUri = mongoDbUri;
