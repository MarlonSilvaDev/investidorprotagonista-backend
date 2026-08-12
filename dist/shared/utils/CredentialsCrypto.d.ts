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
export declare function decryptAesPayload<T = unknown>(aesKey: Buffer, envelope: EncryptedAesEnvelope): T;
export declare function encryptAesPayload(aesKey: Buffer, payload: unknown): EncryptedAesEnvelope;
/** Abre o envelope da requisição (JSON arbitrário) + AES key da sessão. */
export declare function openCredentialsEnvelope(body: EncryptedCredentialsBody): {
    credentials: DecryptedPayload;
    aesKey: Buffer;
};
export declare function isEncryptedCredentialsBody(body: unknown): body is EncryptedCredentialsBody;
//# sourceMappingURL=CredentialsCrypto.d.ts.map