"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class JwtService {
    secret = (0, env_1.getRequiredEnv)('JWT_SECRET', 'development-secret-key-sport-shop');
    expiresIn = '24h';
    generateToken(userId, role) {
        return jsonwebtoken_1.default.sign({ userId, role }, this.secret, { expiresIn: this.expiresIn });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secret);
        }
        catch (error) {
            throw new Error("Token không hợp lệ hoặc đã hết hạn");
        }
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=JwtService.js.map