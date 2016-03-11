/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />
import * as stream from 'stream';
export declare function createCollections(settings: any, connections: any, schemas: any[]): Promise<void>;
export declare function importCollectionFromStream(settings: any, connections: any, schema: any, stream: stream.Readable, options?: {
    truncate: boolean;
    onImported: any;
    format?: string;
}, tenantId?: number): Promise<void>;
export declare function importCollectionFromFile(settings: any, connections: any, schema: any, file: string, options?: {
    truncate: boolean;
    onImported: any;
    format?: string;
}, tenantId?: number): Promise<void>;
