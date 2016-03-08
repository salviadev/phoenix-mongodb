import * as mongodb from 'mongodb';
export declare var db: {
    getCollections: (db: mongodb.Db) => Promise<mongodb.Collection[]>;
    dropCollections: (db: mongodb.Db, except?: string[]) => Promise<void>;
    createCollection: (db: mongodb.Db, collectionName: string) => Promise<mongodb.Collection>;
    clearCollection: (db: mongodb.Db, collection: mongodb.Collection, schema: any, tenantId: number) => Promise<void>;
    dropCollection: (db: mongodb.Db, collectionName: string) => Promise<void>;
};
export declare var collection: {
    dropIndexes: (db: mongodb.Db, collection: mongodb.Collection) => Promise<void>;
    createIndexes: (collection: mongodb.Collection, indexes: any[], multiTenant: string) => Promise<void>;
};
