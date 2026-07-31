import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type EncryptedCredentialsBody = {
  ek: string;
  iv: string;
  data: string;
};

export type EncryptedAesEnvelope = {
  iv: string;
  data: string;
};

export type DecryptedPayload = Record<string, string | undefined>;

function loadPrivateKey(): string {
  const fromEnv = process.env.CREDENTIALS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (fromEnv && fromEnv.includes('BEGIN')) {
    return fromEnv;
  }

  const keyPath =
    process.env.CREDENTIALS_PRIVATE_KEY_PATH ||
    path.join(process.cwd(), 'keys', 'credentials_private.pem');

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Chave privada de credenciais não encontrada em ${keyPath}. ` +
        'Configure CREDENTIALS_PRIVATE_KEY_PATH ou CREDENTIALS_PRIVATE_KEY.'
    );
  }

  return fs.readFileSync(keyPath, 'utf8');
}

function unwrapAesKey(ekBase64: string): Buffer {
  const privateKey = loadPrivateKey();
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(ekBase64, 'base64')
  );
}

export function decryptAesPayload<T = unknown>(
  aesKey: Buffer,
  envelope: EncryptedAesEnvelope
): T {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    aesKey,
    Buffer.from(envelope.iv, 'base64')
  );

  const plain = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(plain) as T;
}

export function encryptAesPayload(
  aesKey: Buffer,
  payload: unknown
): EncryptedAesEnvelope {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
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
export function openCredentialsEnvelope(body: EncryptedCredentialsBody): {
  credentials: DecryptedPayload;
  aesKey: Buffer;
} {
  const aesKey = unwrapAesKey(body.ek);
  const parsed = decryptAesPayload<Record<string, unknown>>(aesKey, {
    iv: body.iv,
    data: body.data,
  });

  const credentials: DecryptedPayload = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value == null) continue;
    credentials[key] = String(value);
  }

  return { aesKey, credentials };
}

export function isEncryptedCredentialsBody(
  body: unknown
): body is EncryptedCredentialsBody {
  if (!body || typeof body !== 'object') return false;
  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.ek === 'string' &&
    typeof candidate.iv === 'string' &&
    typeof candidate.data === 'string'
  );
}
