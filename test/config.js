
"use strict";

exports.connect = {
    port: 45882,
    host: "ds045882.mongolab.com",
    database: "salvia",
    user: "salvia",
    password: "salvia"

};

exports.schema = {
    "name": "images",
    "title": "Images",
    "primaryKey": "id",
    "multiTenant": true,
    "properties": {
        "id": {
            "type": "string"
        },
        "titre": {
            "type": "string"
        },
        "photo": {
            "title": "Photo",
            "type": "binary"
        }
    }
};
