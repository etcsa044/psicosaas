import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider, UploadParams, UploadResult, FileMetadata } from './storage.interface';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export class LocalStorageProvider implements IStorageProvider {
    constructor() {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
    }

    async upload(params: UploadParams): Promise<UploadResult> {
        const ext = path.extname(params.fileName);
        const storagePath = `${params.tenantId}/${uuidv4()}${ext}`;
        const fullPath = path.join(UPLOAD_DIR, storagePath);

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, params.buffer);

        return { storagePath, bucket: 'local' };
    }

    async getSignedUrl(storagePath: string, _expiresInSeconds?: number): Promise<string> {
        // In local dev, return a direct path
        return `/uploads/${storagePath}`;
    }

    async delete(storagePath: string): Promise<void> {
        const fullPath = path.join(UPLOAD_DIR, storagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    async getMetadata(storagePath: string): Promise<FileMetadata> {
        const fullPath = path.join(UPLOAD_DIR, storagePath);
        const stats = fs.statSync(fullPath);
        return {
            size: stats.size,
            mimeType: 'application/octet-stream',
            lastModified: stats.mtime,
        };
    }
}
