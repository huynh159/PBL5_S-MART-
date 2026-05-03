"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/coupons (Admin)
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (_req, res) => {
    try {
        res.json(await PrismaClient_1.prisma.coupon.findMany({ orderBy: { id: 'desc' } }));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/coupons/apply/:code (User)
router.get('/apply/:code', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const coupon = await PrismaClient_1.prisma.coupon.findUnique({ where: { code: req.params.code } });
        if (!coupon || !coupon.isActive || coupon.expiryDate < new Date()) {
            res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
            return;
        }
        res.json(coupon);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/coupons (Admin)
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.expiryDate) {
            data.expiryDate = new Date(data.expiryDate);
        }
        const coupon = await PrismaClient_1.prisma.coupon.create({ data });
        res.status(201).json(coupon);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/coupons/:id (Admin)
router.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = { ...req.body };
        if (data.expiryDate) {
            data.expiryDate = new Date(data.expiryDate);
        }
        const coupon = await PrismaClient_1.prisma.coupon.update({ where: { id }, data });
        res.json(coupon);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/coupons/:id (Admin)
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await PrismaClient_1.prisma.coupon.delete({ where: { id } });
        res.json({ message: 'Đã xóa mã giảm giá' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map