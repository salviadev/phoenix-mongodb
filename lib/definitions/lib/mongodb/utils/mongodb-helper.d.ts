import * as mongodb from 'mongodb';
import * as podata from 'phoenix-odata';
export declare function parseRequestById(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri): {
    primaryKey: any;
    propertyName: string;
    connetionString: string;
    options: any;
    collectionName: string;
    prefix: string;
};
export declare function rejectAndClose(connection: {
    db: mongodb.Db;
    cache: boolean;
}, reject: (reason?: any) => void, reason?: any): void;
export declare function resolveAndClose(connection: {
    db: mongodb.Db;
    cache: boolean;
}, resolve: (data?: any) => void, data?: any): void;
