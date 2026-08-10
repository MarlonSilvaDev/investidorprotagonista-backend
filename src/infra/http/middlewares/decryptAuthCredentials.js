"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptAuthCredentials = decryptAuthCredentials;
const express_1 = require("express");
const CredentialsCrypto_1 = require("../../../core/utils/CredentialsCrypto");
/** Decripta request e criptografa responses 2xx com a AES key da sessão. */
function decryptAuthCredentials(request, response, next) {
    try {
        if (!(0, CredentialsCrypto_1.isEncryptedCredentialsBody)(request.body)) {
            return response.status(400).json({
                message: 'Credenciais devem ser enviadas criptografadas (campos ek, iv, data)',
            });
        }
        const outerBody = (request.body ?? {});
        // Preserva campos fora do envelope (ex.: locale) e sobrescreve com o payload AES.
        const { ek: _ek, iv: _iv, data: _data, ...preservedOuter } = outerBody;
        const { credentials, aesKey } = (0, CredentialsCrypto_1.openCredentialsEnvelope)(request.body);
        request.credentialsAesKey = aesKey;
        request.body = { ...preservedOuter, ...credentials };
        const originalJson = response.json.bind(response);
        response.json = ((body) => {
            const status = response.statusCode || 200;
            if (status >= 200 && status < 300) {
                return originalJson((0, CredentialsCrypto_1.encryptAesPayload)(aesKey, body));
            }
            return originalJson(body);
        });
        return next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao decriptar credenciais';
        return response.status(400).json({ message });
    }
}
//# sourceMappingURL=decryptAuthCredentials.js.map