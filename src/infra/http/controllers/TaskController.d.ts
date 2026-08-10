import { Request, Response } from 'express';
export declare class TaskController {
    list(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    create(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
    toggle(request: Request, response: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=TaskController.d.ts.map