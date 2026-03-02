import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { config } from '@config/index';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
    return Buffer.from(config.encryption.key, 'hex');
}

export interface EncryptedField {
    iv: string;
    data: string;
    tag: string;
}

export function encrypt(text: string): EncryptedField {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        data: encrypted,
        tag: authTag.toString('hex'),
    };
}

export function decrypt(field: EncryptedField): string {
    const key = getKey();
    const iv = Buffer.from(field.iv, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(field.tag, 'hex'));

    let decrypted = decipher.update(field.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function hashSHA256(content: string): string {
    return createHash('sha256').update(content).digest('hex');
}
