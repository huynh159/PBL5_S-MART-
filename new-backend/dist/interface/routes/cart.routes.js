"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/cart
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const items = await PrismaClient_1.prisma.cartItem.findMany({
            where: { userId: req.user.userId },
            include: { product: { include: { images: true } } }
        });
        res.json(items);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/cart
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { productId, quantity, color, size, price } = req.body;
        // Kiểm tra tồn kho (Domain Invariant: Cart check stock)
        const product = await PrismaClient_1.prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            res.status(404).json({ error: 'Sản phẩm không tồn tại' });
            return;
        }
        if (product.stock < quantity) {
            res.status(400).json({ error: 'Tồn kho không đủ' });
            return;
        }
        const item = await PrismaClient_1.prisma.cartItem.create({
            data: { userId: req.user.userId, productId, quantity, color, size, price }
        });
        res.status(201).json(item);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/cart/:id?quantity=2
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const quantity = parseInt(req.query['quantity']);
        const item = await PrismaClient_1.prisma.cartItem.update({ where: { id }, data: { quantity } });
        res.json(item);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/cart/:id
router.delete('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await PrismaClient_1.prisma.cartItem.delete({ where: { id } });
        res.json({ message: 'Đã xóa khỏi giỏ hàng' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/cart/clear
router.delete('/clear', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        await PrismaClient_1.prisma.cartItem.deleteMany({ where: { userId: req.user.userId } });
        res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=cart.routes.js.map