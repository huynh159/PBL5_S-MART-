"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-sport-shop';
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
            return;
        }
        const existing = await PrismaClient_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email đã được sử dụng' });
            return;
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        // Sinh OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        const user = await PrismaClient_1.prisma.user.create({
            data: { email, password: hash, role: 'CUSTOMER', isVerified: false, otpCode: otp, otpExpiry }
        });
        // TODO: Gửi mail OTP thực tế (nodemailer)
        res.status(201).json({ message: 'Đăng ký thành công! Kiểm tra email để xác minh OTP.', userId: user.id });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await PrismaClient_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
            return;
        }
        await PrismaClient_1.prisma.user.update({ where: { id: user.id }, data: { isVerified: true, otpCode: null, otpExpiry: null } });
        res.json({ message: 'Xác minh OTP thành công' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await PrismaClient_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE') {
            res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
            return;
        }
        const match = await bcrypt_1.default.compare(password, user.password);
        if (!match) {
            res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, userId: user.id, email: user.email });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/auth/google-login
router.post('/google-login', async (req, res) => {
    try {
        const { idToken } = req.body;
        // Verify Google token (simplified - in production use google-auth-library)
        const { OAuth2Client } = await Promise.resolve().then(() => __importStar(require('google-auth-library')));
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload?.email) {
            res.status(400).json({ error: 'Token Google không hợp lệ' });
            return;
        }
        let user = await PrismaClient_1.prisma.user.findUnique({ where: { email: payload.email } });
        if (user && user.status === 'LOCKED') {
            res.status(401).json({ error: 'Tài khoản của bạn đã bị khóa bởi Admin' });
            return;
        }
        if (!user) {
            user = await PrismaClient_1.prisma.user.create({
                data: { email: payload.email, password: '', role: 'CUSTOMER', isVerified: true }
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, role: user.role, userId: user.id, email: user.email });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await PrismaClient_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.json({ message: 'Nếu email tồn tại, OTP đã được gửi' });
            return;
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await PrismaClient_1.prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
        // TODO: gửi mail
        res.json({ message: 'OTP đã được gửi về email' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await PrismaClient_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
            return;
        }
        const hash = await bcrypt_1.default.hash(newPassword, 10);
        await PrismaClient_1.prisma.user.update({ where: { id: user.id }, data: { password: hash, otpCode: null, otpExpiry: null } });
        res.json({ message: 'Đổi mật khẩu thành công' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/auth/me  (lấy thông tin user hiện tại)
router.get('/me', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await PrismaClient_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, email: true, role: true, status: true, isVerified: true, createdAt: true }
        });
        res.json(user);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map