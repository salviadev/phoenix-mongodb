/// <reference path="../../../../node_modules/phoenix-utils/lib/definitions/phoenix-utils.d.ts" />
import * as mongodb from 'mongodb';
export declare function execOdataQuery(db: mongodb.Db, collectionName: string, schema: any, filter: any, options: any): Promise<any>;
