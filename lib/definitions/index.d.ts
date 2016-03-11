import * as stream from 'stream';
import { OdataParsedUri } from 'phoenix-odata';
export declare var schema: {
    createCollections: (connectionUri: string, schemas: any[]) => Promise<void>;
    importCollectionFromFile: (settings: any, connections: any, schema: any, file: string, options?: {
        truncate: boolean;
        onImported: any;
        format?: string;
    }, tenantId?: number) => Promise<void>;
    importCollectionFromStream: (settings: any, connections: any, schema: any, stream: stream.Readable, options?: {
        truncate: boolean;
        onImported: any;
        format?: string;
    }, tenantId?: number) => Promise<void>;
};
export declare var upload: {
    uploadBinaryProperty: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri, fileName: string, contentType: string, stream: any) => Promise<void>;
    downloadBinaryProperty: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri, res: any) => Promise<void>;
};
export declare var odata: {
    execQuery: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
    execQueryId: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
    execDelete: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<void>;
};
