import * as mongodb from 'mongodb';
export declare function insert(collection: mongodb.Collection, value: any): Promise<any>;
export declare function collection(db: mongodb.Db, collectionName: string): Promise<mongodb.Collection>;
export declare function connect(uri: string): Promise<mongodb.Db>;
export declare function close(db: mongodb.Db): Promise<void>;
