"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
exports.adminMiddleware = adminMiddleware;
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const env_1 = require("../../infrastructure/config/env");
// ── Auth Middleware (JWT verify) ─────────────────────
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Chưa đăng nhập' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const secret = (0, env_1.getRequiredEnv)('JWT_SECRET', 'development-secret-key-sport-shop');
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Kiểm tra xem tài khoản có bị khóa không
        const user = await PrismaClient_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { status: true }
        });
        if (!user) {
            res.status(401).json({ error: 'Người dùng không tồn tại' });
            return;
        }
        if (user.status === 'LOCKED') {
            res.status(401).json({ error: 'Tài khoản của bạn đã bị khóa bởi Admin' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};
exports.authMiddleware = authMiddleware;
function adminMiddleware(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Không có quyền truy cập' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map