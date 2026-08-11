import { Request, Response } from 'express';
export declare class AuthenticateController {
    register(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    verifySms(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    sendVerificationCode(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    confirmEmail(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    login(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    forgotPassword(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    resetPasswordForm(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    resetPassword(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    google(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Primeiro acesso Google (sem CPF): grava CPF único na conta autenticada.
     * Contas que já têm CPF não podem alterar por este endpoint.
     */
    completeCpf(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    refresh(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AuthenticateController.d.ts.map