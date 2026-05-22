import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { getRequiredEnv } from '../../infrastructure/config/env';

// ── Auth Middleware (JWT verify) ─────────────────────
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
    user?: { userId: number; role: string };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Chưa đăng nhập' });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const secret = getRequiredEnv('JWT_SECRET', 'development-secret-key-sport-shop');
        const decoded = jwt.verify(token, secret) as { userId: number; role: string };

        // Kiểm tra xem tài khoản có bị khóa không
        const user = await prisma.user.findUnique({
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
    } catch {
        res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Không có quyền truy cập' });
        return;
    }
    next();
}
