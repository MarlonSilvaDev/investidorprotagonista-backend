declare namespace Express {
  interface Request {
    user: {
      id: string;
      role?: string;
    };
    /** AES-256 key da sessão de login/register (setada pelo middleware). */
    credentialsAesKey?: Buffer;
  }
}
