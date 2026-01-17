const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.SMS_ENCRYPTION_KEY || 'default-32-char-key-change-me!'; // Must be 32 chars
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data (e.g., API keys, passwords)
 */
function encrypt(text) {
    if (!text) return null;

    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, ' ').substring(0, 32));
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text) {
    if (!text) return null;

    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, ' ').substring(0, 32));
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Encrypt provider credentials in config
 */
function encryptProviderConfig(config) {
    if (!config || !config.credentials) return config;

    const encrypted = { ...config };
    encrypted.credentials = {};

    for (const [key, value] of Object.entries(config.credentials)) {
        if (value) {
            encrypted.credentials[key] = encrypt(value);
        }
    }

    return encrypted;
}

/**
 * Decrypt provider credentials from config
 */
function decryptProviderConfig(config) {
    if (!config || !config.credentials) return config;

    const decrypted = { ...config };
    decrypted.credentials = {};

    for (const [key, value] of Object.entries(config.credentials)) {
        if (value) {
            decrypted.credentials[key] = decrypt(value);
        }
    }

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
    encryptProviderConfig,
    decryptProviderConfig
};
