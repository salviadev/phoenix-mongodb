import * as mongodb from 'mongodb';
export * from './lib/mongodb/connection';
export declare var db: {
    connect: (uri: string) => Promise<mongodb.Db>;
    close: (db: mongodb.Db) => Promise<void>;
};
