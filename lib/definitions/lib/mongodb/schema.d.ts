/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
import * as stream from 'stream';
export declare function createCollections(connectionUri: string, schemas: any[]): Promise<void>;
export declare function importCollectionFromStream(connectionUri: string, schema: any, stream: stream.Readable, options?: {
    truncate: boolean;
    onImported: any;
}, tenantId?: number): Promise<void>;
export declare function importCollectionFromFile(connectionUri: string, schema: any, file: string, options?: {
    truncate: boolean;
    onImported: any;
}, tenantId?: number): Promise<void>;
