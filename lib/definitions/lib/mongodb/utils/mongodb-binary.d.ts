export declare function removeFileById(db: any, id: string, cb: (ex: any) => void): void;
export declare function removeFileByIdPromise(db: any, id: string): Promise<void>;
export declare function removeFilesByParent(db: any, parent: string, tenantId: number, cb: (ex: any) => void): void;
export declare function uploadBinaryProperty(uri: string, schema: any, pk: any, propertyName: string, fileName: string, contentType: string, stream: any, cb: (ex: any) => void): void;
export declare function downloadBinaryProperty(uri: string, schema: any, pk: any, propertyName: string, res: any, cb: (ex: any) => void): void;
export declare function uploadStream(db: any, schema: any, fileName: string, contentType: string, stream: any, tenantId: number, cb: (ex: any, id: any) => void): void;
