"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/categories
router.get('/', async (_req, res) => {
    try {
        const categories = await PrismaClient_1.prisma.category.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(categories);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/categories (Admin)
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
            return;
        }
        const category = await PrismaClient_1.prisma.category.create({ data: { name, description } });
        res.status(201).json(category);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/categories/:id (Admin)
router.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ error: 'Tên danh mục là bắt buộc' });
            return;
        }
        const existing = await PrismaClient_1.prisma.category.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Không tìm thấy danh mục' });
            return;
        }
        const category = await PrismaClient_1.prisma.category.update({
            where: { id },
            data: { name, description }
        });
        res.json(category);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/categories/:id (Admin)
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await PrismaClient_1.prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } }
        });
        if (!existing) {
            res.status(404).json({ error: 'Không tìm thấy danh mục' });
            return;
        }
        if (existing._count.products > 0) {
            res.status(400).json({ error: `Không thể xóa vì danh mục này đang chứa ${existing._count.products} sản phẩm. Hãy đổi danh mục cho các sản phẩm đó trước.` });
            return;
        }
        await PrismaClient_1.prisma.category.delete({ where: { id } });
        res.json({ message: 'Đã xóa danh mục thành công' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=category.routes.js.map