"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const toAbsoluteMediaUrl = (url, baseUrl) => {
    if (!url)
        return url;
    if (url.startsWith('http://') || url.startsWith('https://'))
        return url;
    if (url.startsWith('/'))
        return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
};
const mapProductResponse = (product, baseUrl) => ({
    ...product,
    imageUrl: toAbsoluteMediaUrl(product.imageUrl, baseUrl),
    imageUrls: Array.isArray(product.images)
        ? product.images.map((img) => toAbsoluteMediaUrl(img.imageUrl, baseUrl))
        : []
});
// GET /api/products?page=0&size=12&search=&categoryId=
router.get('/', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page']) || 0;
        const size = parseInt(req.query['size']) || 12;
        const search = req.query['search'] || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId']) : undefined;
        const where = { status: 'ACTIVE' };
        if (search)
            where.name = { contains: search };
        if (categoryId)
            where.categoryId = categoryId;
        const [products, total] = await Promise.all([
            PrismaClient_1.prisma.product.findMany({
                where, skip: page * size, take: size,
                include: { category: true, images: true },
                orderBy: { id: 'desc' }
            }),
            PrismaClient_1.prisma.product.count({ where })
        ]);
        res.json({
            content: products.map((p) => mapProductResponse(p, baseUrl)),
            totalElements: total,
            totalPages: Math.ceil(total / size),
            number: page
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/products/admin/all?page=0&size=500&search=&categoryId=
router.get('/admin/all', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.query['page']) || 0;
        const size = parseInt(req.query['size']) || 500;
        const search = req.query['search'] || '';
        const categoryId = req.query['categoryId'] ? parseInt(req.query['categoryId']) : undefined;
        const where = {};
        if (search)
            where.name = { contains: search };
        if (categoryId)
            where.categoryId = categoryId;
        const [products, total] = await Promise.all([
            PrismaClient_1.prisma.product.findMany({
                where,
                skip: page * size,
                take: size,
                include: { category: true, images: true },
                orderBy: { id: 'desc' }
            }),
            PrismaClient_1.prisma.product.count({ where })
        ]);
        res.json({
            content: products.map((p) => mapProductResponse(p, baseUrl)),
            totalElements: total,
            totalPages: Math.ceil(total / size),
            number: page
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id);
        const product = await PrismaClient_1.prisma.product.findUnique({ where: { id }, include: { category: true, images: true } });
        if (!product) {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
            return;
        }
        res.json(mapProductResponse(product, baseUrl));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/products/:id/detail
router.get('/:id/detail', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id);
        const product = await PrismaClient_1.prisma.product.findUnique({
            where: { id },
            include: {
                category: true, images: true,
                reviews: { include: { user: { select: { id: true, email: true } } }, orderBy: { createdAt: 'desc' } }
            }
        });
        if (!product) {
            res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
            return;
        }
        res.json(mapProductResponse(product, baseUrl));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/products/category/:categoryId
router.get('/category/:categoryId', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const categoryId = parseInt(req.params.categoryId);
        const products = await PrismaClient_1.prisma.product.findMany({
            where: { categoryId, status: 'ACTIVE' },
            include: { images: true },
            orderBy: { id: 'desc' }
        });
        res.json(products.map((p) => mapProductResponse(p, baseUrl)));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/products/:id/recommend (sản phẩm cùng danh mục)
router.get('/:id/recommend', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const id = parseInt(req.params.id);
        const product = await PrismaClient_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.json([]);
            return;
        }
        const similar = await PrismaClient_1.prisma.product.findMany({
            where: { categoryId: product.categoryId, id: { not: id }, status: 'ACTIVE' },
            take: 8, include: { images: true }, orderBy: { id: 'desc' }
        });
        res.json(similar.map((p) => mapProductResponse(p, baseUrl)));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/products (Admin)
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const { imageUrls, ...productData } = req.body || {};
        const product = await PrismaClient_1.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({ data: productData });
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                await tx.productImage.createMany({
                    data: imageUrls
                        .filter((url) => typeof url === 'string' && url.trim().length > 0)
                        .map((url) => ({ productId: created.id, imageUrl: url }))
                });
            }
            return created;
        });
        res.status(201).json(product);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/products/:id (Admin)
router.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { imageUrls, ...productData } = req.body || {};
        const product = await PrismaClient_1.prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({ where: { id }, data: productData });
            if (Array.isArray(imageUrls)) {
                await tx.productImage.deleteMany({ where: { productId: id } });
                if (imageUrls.length > 0) {
                    await tx.productImage.createMany({
                        data: imageUrls
                            .filter((url) => typeof url === 'string' && url.trim().length > 0)
                            .map((url) => ({ productId: id, imageUrl: url }))
                    });
                }
            }
            return updated;
        });
        res.json(product);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/products/:id (Admin)
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        try {
            await PrismaClient_1.prisma.product.delete({ where: { id } });
        }
        catch (deleteError) {
            // Nếu sản phẩm đã phát sinh đơn hàng thì không thể xóa cứng -> chuyển sang ẩn
            if (String(deleteError?.message || '').includes('Foreign key constraint violated')) {
                await PrismaClient_1.prisma.product.update({
                    where: { id },
                    data: { status: 'HIDDEN' }
                });
                res.json({ message: 'Sản phẩm đã phát sinh dữ liệu, đã chuyển sang trạng thái ẩn' });
                return;
            }
            throw deleteError;
        }
        res.json({ message: 'Đã xóa sản phẩm' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=product.routes.js.map