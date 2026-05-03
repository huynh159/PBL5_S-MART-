"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
class AuthController {
    authUseCases;
    constructor(authUseCases) {
        this.authUseCases = authUseCases;
    }
    async register(req, res) {
        try {
            await this.authUseCases.registerCustomer(req.body);
            res.status(201).json({ message: "Đăng ký thành công!" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async login(req, res) {
        try {
            const result = await this.authUseCases.login(req.body);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(401).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map