import * as mongodb from 'mongodb';
import * as stream from 'stream';
export declare var db: {
    connectionString: (configMongo: {
        port?: number;
        host?: string;
        user?: string;
        password?: string;
        database?: string;
        options?: any;
    }) => string;
    connect: (uri: string) => Promise<mongodb.Db>;
    close: (db: mongodb.Db) => Promise<void>;
};
export declare var schema: {
    createDatabase: (db: mongodb.Db, schemas: any[]) => Promise<void>;
    importCollectionFromFile: (db: mongodb.Db, schema: any, file: string, options?: any, tenantId?: number) => Promise<void>;
    importCollectionFromStream: (db: mongodb.Db, schema: any, stream: stream.Readable, options?: any, tenantId?: number) => Promise<void>;
};
