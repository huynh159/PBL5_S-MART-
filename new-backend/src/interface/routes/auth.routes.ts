import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { sendOtpEmail } from '../../infrastructure/external-services/EmailService';
import { getRequiredEnv } from '../../infrastructure/config/env';

const router = Router();
const JWT_SECRET = getRequiredEnv('JWT_SECRET', 'development-secret-key-sport-shop');

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email va mat khau la bat buoc' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email da duoc su dung' });
            return;
        }

        const hash = await bcrypt.hash(password, 10);
        const otp = generateOtp();
        const otpExpiry = getOtpExpiry();

        const user = await prisma.user.create({
            data: { email, password: hash, role: 'CUSTOMER', isVerified: false, otpCode: otp, otpExpiry }
        });

        await sendOtpEmail(email, otp, 'register');
        res.status(201).json({ message: 'Dang ky thanh cong. Kiem tra email de xac minh OTP.', userId: user.id });
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
            res.status(400).json({ error: 'OTP khong hop le hoac da het han' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, otpCode: null, otpExpiry: null }
        });
        res.json({ message: 'Xac minh OTP thanh cong' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE') {
            res.status(401).json({ error: 'Email hoac mat khau khong chinh xac' });
            return;
        }

        if (!user.isVerified) {
            res.status(403).json({ error: 'Tai khoan chua xac minh OTP' });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(401).json({ error: 'Email hoac mat khau khong chinh xac' });
            return;
        }

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
        const { OAuth2Client } = await import('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            res.status(400).json({ error: 'Token Google khong hop le' });
            return;
        }

        let user = await prisma.user.findUnique({ where: { email: payload.email } });

        if (user && user.status === 'LOCKED') {
            res.status(401).json({ error: 'Tai khoan cua ban da bi khoa boi Admin' });
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
        if (!user) {
            res.json({ message: 'Neu email ton tai, OTP da duoc gui' });
            return;
        }

        const otp = generateOtp();
        const otpExpiry = getOtpExpiry();
        await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
        await sendOtpEmail(email, otp, 'reset-password');
        res.json({ message: 'OTP da duoc gui ve email' });
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
            res.status(400).json({ error: 'OTP khong hop le hoac da het han' });
            return;
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hash, otpCode: null, otpExpiry: null }
        });
        res.json({ message: 'Doi mat khau thanh cong' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Vui long nhap day du mat khau hien tai va mat khau moi' });
            return;
        }

        if (String(newPassword).length < 6) {
            res.status(400).json({ error: 'Mat khau moi phai co it nhat 6 ky tu' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        if (!user) {
            res.status(404).json({ error: 'Khong tim thay tai khoan' });
            return;
        }

        if (!user.password) {
            res.status(400).json({ error: 'Tai khoan nay dang dung Google Login, chua co mat khau cu de doi' });
            return;
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            res.status(400).json({ error: 'Mat khau hien tai khong chinh xac' });
            return;
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash }
        });

        res.json({ message: 'Doi mat khau thanh cong' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/me
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
