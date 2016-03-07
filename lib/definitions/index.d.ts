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
    uploadBinaryProperty: (uri: string, schema: any, pk: any, propertyName: string, fileName: string, contentType: string, stream: any, cb: (ex: any) => void) => void;
    downloadBinaryProperty: (uri: string, schema: any, pk: any, propertyName: string, res: any, cb: (ex: any) => void) => void;
};
export declare var odata: {
    execQuery: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
    execQueryId: (settings: any, connections: any, schema: any, odataUri: OdataParsedUri) => Promise<any>;
};
