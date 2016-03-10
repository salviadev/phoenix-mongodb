exports.userschema = {
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
