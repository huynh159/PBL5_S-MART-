import { Request, Response } from 'express';
import { AuthUseCases } from '../../application/use-cases/AuthUseCases';

export class AuthController {
    constructor(private readonly authUseCases: AuthUseCases) {}

    public async register(req: Request, res: Response): Promise<void> {
        try {
            await this.authUseCases.registerCustomer(req.body);
            res.status(201).json({ message: "Đăng ký thành công!" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.authUseCases.login(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}
