import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-sport-shop';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) { res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' }); return; }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) { res.status(409).json({ error: 'Email đã được sử dụng' }); return; }
        const hash = await bcrypt.hash(password, 10);
        // Sinh OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        const user = await prisma.user.create({
            data: { email, password: hash, role: 'CUSTOMER', isVerified: false, otpCode: otp, otpExpiry }
        });
        // TODO: Gửi mail OTP thực tế (nodemailer)
        res.status(201).json({ message: 'Đăng ký thành công! Kiểm tra email để xác minh OTP.', userId: user.id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' }); return;
        }
        await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, otpCode: null, otpExpiry: null } });
        res.json({ message: 'Xác minh OTP thành công' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE') { res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' }); return; }
        const match = await bcrypt.compare(password, user.password);
        if (!match) { res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' }); return; }
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, userId: user.id, email: user.email });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/google-login
router.post('/google-login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;
        // Verify Google token (simplified - in production use google-auth-library)
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email) { res.status(400).json({ error: 'Token Google không hợp lệ' }); return; }

        let user = await prisma.user.findUnique({ where: { email: payload.email } });

        if (user && user.status === 'LOCKED') {
            res.status(401).json({ error: 'Tài khoản của bạn đã bị khóa bởi Admin' });
            return;
        }

        if (!user) {
            user = await prisma.user.create({
                data: { email: payload.email, password: '', role: 'CUSTOMER', isVerified: true }
            });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, userId: user.id, email: user.email });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) { res.json({ message: 'Nếu email tồn tại, OTP đã được gửi' }); return; }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
        // TODO: gửi mail
        res.json({ message: 'OTP đã được gửi về email' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' }); return;
        }
        const hash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hash, otpCode: null, otpExpiry: null } });
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/me  (lấy thông tin user hiện tại)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { id: true, email: true, role: true, status: true, isVerified: true, createdAt: true }
        });
        res.json(user);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
