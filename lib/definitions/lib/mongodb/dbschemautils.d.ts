export declare var db: {
    getCollections: (db: any) => Promise<any[]>;
    dropCollections: (db: any, except?: string[]) => Promise<void>;
    createCollection: (db: any, collectionName: string) => Promise<any>;
    dropCollection: (db: any, collectionName: string) => Promise<void>;
};
export declare var collection: {
    dropAllIndexes: (db: any, collection: any) => Promise<void>;
    createIndexes: (collection: any, indexes: any[]) => Promise<void>;
};
