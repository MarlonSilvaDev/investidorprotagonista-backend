import jwt from 'jsonwebtoken';

export type AuthMailTokenType = 'email_confirm' | 'password_reset';

export type AuthMailTokenPayload = {
  sub: string;
  email: string;
  type: AuthMailTokenType;
};

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }
  return secret;
}

export function signAuthMailToken(
  payload: AuthMailTokenPayload,
  expiresIn: jwt.SignOptions['expiresIn'] = '24h'
): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn });
}

export function verifyAuthMailToken(token: string): AuthMailTokenPayload {
  const decoded = jwt.verify(token, jwtSecret()) as AuthMailTokenPayload;
  if (!decoded?.sub || !decoded?.email || !decoded?.type) {
    throw new Error('Token inválido');
  }
  return decoded;
}
