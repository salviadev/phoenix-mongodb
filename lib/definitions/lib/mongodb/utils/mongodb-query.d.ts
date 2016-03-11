import * as podata from 'phoenix-odata';
export declare function execOdataQuery(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri): Promise<any>;
export declare function execOdataQueryId(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri): Promise<any>;
export declare function execDelete(settings: any, connections: any, schema: any, odataUri: podata.OdataParsedUri): Promise<void>;
