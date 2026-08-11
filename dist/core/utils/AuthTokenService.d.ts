import jwt from 'jsonwebtoken';
export type AuthMailTokenType = 'email_confirm' | 'password_reset';
export type AuthMailTokenPayload = {
    sub: string;
    email: string;
    type: AuthMailTokenType;
};
export declare function signAuthMailToken(payload: AuthMailTokenPayload, expiresIn?: jwt.SignOptions['expiresIn']): string;
export declare function verifyAuthMailToken(token: string): AuthMailTokenPayload;
//# sourceMappingURL=AuthTokenService.d.ts.map