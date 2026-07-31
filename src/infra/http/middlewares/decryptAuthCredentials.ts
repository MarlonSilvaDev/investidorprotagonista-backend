import { NextFunction, Request, Response } from 'express';
import {
  encryptAesPayload,
  isEncryptedCredentialsBody,
  openCredentialsEnvelope,
} from '../../../core/utils/CredentialsCrypto';

/** Decripta request e criptografa responses 2xx com a AES key da sessão. */
export function decryptAuthCredentials(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    if (!isEncryptedCredentialsBody(request.body)) {
      return response.status(400).json({
        message:
          'Credenciais devem ser enviadas criptografadas (campos ek, iv, data)',
      });
    }

    const { credentials, aesKey } = openCredentialsEnvelope(request.body);
    request.credentialsAesKey = aesKey;
    request.body = { ...credentials };

    const originalJson = response.json.bind(response);
    response.json = ((body: unknown) => {
      const status = response.statusCode || 200;
      if (status >= 200 && status < 300) {
        return originalJson(encryptAesPayload(aesKey, body));
      }
      return originalJson(body);
    }) as Response['json'];

    return next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao decriptar credenciais';
    return response.status(400).json({ message });
  }
}
