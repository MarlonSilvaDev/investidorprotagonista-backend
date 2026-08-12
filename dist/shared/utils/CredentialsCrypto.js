"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptAesPayload = decryptAesPayload;
exports.encryptAesPayload = encryptAesPayload;
exports.openCredentialsEnvelope = openCredentialsEnvelope;
exports.isEncryptedCredentialsBody = isEncryptedCredentialsBody;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
function loadPrivateKey() {
    const fromEnv = process.env.CREDENTIALS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (fromEnv && fromEnv.includes('BEGIN')) {
        return fromEnv;
    }
    const keyPath = process.env.CREDENTIALS_PRIVATE_KEY_PATH ||
        path_1.default.join(process.cwd(), 'keys', 'credentials_private.pem');
    if (!fs_1.default.existsSync(keyPath)) {
        throw new Error(`Chave privada de credenciais não encontrada em ${keyPath}. ` +
            'Configure CREDENTIALS_PRIVATE_KEY_PATH ou CREDENTIALS_PRIVATE_KEY.');
    }
    return fs_1.default.readFileSync(keyPath, 'utf8');
}
function unwrapAesKey(ekBase64) {
    const privateKey = loadPrivateKey();
    return crypto_1.default.privateDecrypt({
        key: privateKey,
        padding: crypto_1.default.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(ekBase64, 'base64'));
}
function decryptAesPayload(aesKey, envelope) {
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', aesKey, Buffer.from(envelope.iv, 'base64'));
    const plain = Buffer.concat([
        decipher.update(Buffer.from(envelope.data, 'base64')),
        decipher.final(),
    ]).toString('utf8');
    return JSON.parse(plain);
}
function encryptAesPayload(aesKey, payload) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', aesKey, iv);
    const data = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final(),
    ]);
    return {
        iv: iv.toString('base64'),
        data: data.toString('base64'),
    };
}
/** Abre o envelope da requisição (JSON arbitrário) + AES key da sessão. */
function openCredentialsEnvelope(body) {
    const aesKey = unwrapAesKey(body.ek);
    const parsed = decryptAesPayload(aesKey, {
        iv: body.iv,
        data: body.data,
    });
    const credentials = {};
    for (const [key, value] of Object.entries(parsed)) {
        if (value == null)
            continue;
        credentials[key] = String(value);
    }
    return { aesKey, credentials };
}
function isEncryptedCredentialsBody(body) {
    if (!body || typeof body !== 'object')
        return false;
    const candidate = body;
    return (typeof candidate.ek === 'string' &&
        typeof candidate.iv === 'string' &&
        typeof candidate.data === 'string');
}
//# sourceMappingURL=CredentialsCrypto.js.map