import { NextFunction, Request, Response } from 'express';
/** Decripta request e criptografa responses 2xx com a AES key da sessão. */
export declare function decryptAuthCredentials(request: Request, response: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=decryptAuthCredentials.d.ts.map