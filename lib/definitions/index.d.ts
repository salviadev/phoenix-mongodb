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
};
export declare var schema: {
    createCollections: (connectionUri: string, schemas: any[]) => Promise<void>;
    importCollectionFromFile: (connectionUri: string, schema: any, file: string, options?: any, tenantId?: number) => Promise<void>;
    importCollectionFromStream: (connectionUri: string, schema: any, stream: stream.Readable, options?: any, tenantId?: number) => Promise<void>;
};
export declare var odata: {
    execQuery: (connetionString: string, collectionName: string, schema: any, filter: any, options: any) => Promise<any>;
    execQueryId: (connetionString: string, collectionName: string, schema: any, primaryKey: any, options: any) => Promise<any>;
};
