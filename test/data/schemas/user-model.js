exports.userschema01 = {
    "name": "user",
    "title": "Users",
    "primaryKey": "id",
    "properties": {
        "id": {
            "type": "number"
        },
        "firstName": {
            "type": "string"
        },
        "lastName": {
            "type": "string"
        },
        "photo": {
            "title": "Photo",
            "type": "binary"
        }
    }
};


exports.userschema02 = {
    "name": "suser",
    "title": "Users",
    "multiTenant": "share",
    "primaryKey": "id",
    "properties": {
        "id": {
            "type": "number"
        },
        "firstName": {
            "type": "string"
        },
        "lastName": {
            "type": "string"
        },
        "photo": {
            "title": "Photo",
            "type": "binary"
        }
    }
};

exports.userschema03 = {
    "name": "customer",
    "title": "Customers",
    "multiTenant": "share",
    "primaryKey": "id",
    "properties": {
        "id": {
            "type": "number"
        },
        "firstName": {
            "type": "string"
        },
        "lastName": {
            "type": "string"
        },
        "photo": {
            "title": "Photo",
            "type": "binary"
        }
    }
};
