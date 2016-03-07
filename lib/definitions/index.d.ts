import * as stream from 'stream';
import { OdataParsedUri } from 'phoenix-odata';
export declare var schema: {
    createCollections: (connectionUri: string, schemas: any[]) => Promise<void>;
    importCollectionFromFile: (connectionUri: string, schema: any, file: string, options?: {
        truncate: boolean;
        onImported: any;
        format?: string;
    }, tenantId?: number) => Promise<void>;
    importCollectionFromStream: (connectionUri: string, schema: any, stream: stream.Readable, options?: {
        truncate: boolean;
        onImported: any;
        format?: string;
    }, tenantId?: number) => Promise<void>;
};
export declare var upload: {
    uploadBinaryProperty: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri, fileName: string, contentType: string, stream: any, cb: (ex: any) => void) => void;
    downloadBinaryProperty: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri, res: any, cb: (ex: any) => void) => void;
};
export declare var odata: {
    execQuery: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
    execQueryId: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
};
