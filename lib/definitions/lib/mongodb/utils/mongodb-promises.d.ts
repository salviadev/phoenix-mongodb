import * as mongodb from 'mongodb';
export declare function connectAndCache(uri: string, connections: any, cb: (err, res: {
    db: mongodb.Db;
    cache: boolean;
}) => void): void;
export declare function connectAndCachePromise(uri: string, connections: any): Promise<{
    db: mongodb.Db;
    cache: boolean;
}>;
export declare function insert(collection: mongodb.Collection, value: any): Promise<any>;
export declare function collection(db: mongodb.Db, collectionName: string): Promise<mongodb.Collection>;
export declare function connect(uri: string): Promise<mongodb.Db>;
export declare function close(db: mongodb.Db): Promise<void>;
