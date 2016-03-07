import * as podata from 'phoenix-odata';
export declare function removeFileById(db: any, id: string, cb: (ex: any) => void): void;
export declare function removeFileByIdPromise(db: any, id: string): Promise<void>;
export declare function removeFilesByParent(db: any, parent: string, tenantId: number, cb: (ex: any) => void): void;
export declare function uploadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, fileName: string, contentType: string, stream: any, cb: (ex: any) => void): void;
export declare function downloadBinaryProperty(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri, res: any, cb: (ex: any) => void): void;
export declare function uploadStream(db: any, schema: any, prefix: string, fileName: string, contentType: string, stream: any, tenantId: number, cb: (ex: any, id: any) => void): void;
