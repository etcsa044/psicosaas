export interface FileMetadata {
    size: number;
    mimeType: string;
    lastModified?: Date;
}

export interface UploadParams {
    tenantId: string;
    fileName: string;
    buffer: Buffer;
    mimeType: string;
}

export interface UploadResult {
    storagePath: string;
    bucket: string;
}

export interface IStorageProvider {
    upload(params: UploadParams): Promise<UploadResult>;
    getSignedUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;
    delete(storagePath: string): Promise<void>;
    getMetadata(storagePath: string): Promise<FileMetadata>;
}
