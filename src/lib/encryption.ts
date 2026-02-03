import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Ensure we have a consistent secret key from env, fallback for dev but should be required
const SECRET_KEY = process.env.AUTH_SECRET || 'default-secret-key-at-least-32-chars-long';
// Resize key to 32 bytes (256 bits) if needed
const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encryptBuffer(buffer: Buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Return combined encrypted data and authTag plus IV seperately
    // We'll store IV in DB, but AuthTag needs to be stored with the data or separately.
    // Common practice: Prepend AuthTag to encrypted data.
    return {
        encryptedData: Buffer.concat([authTag, encrypted]),
        iv: iv.toString('hex')
    };
}

export function decryptBuffer(encryptedBufferWithTag: Buffer, ivHex: string): Buffer {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = encryptedBufferWithTag.subarray(0, 16);
    const encrypted = encryptedBufferWithTag.subarray(16);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);
}
