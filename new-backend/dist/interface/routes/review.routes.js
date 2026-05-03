"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const reviews = await PrismaClient_1.prisma.review.findMany({
            where: { productId },
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/reviews/product/:productId/stats
router.get('/product/:productId/stats', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const reviews = await PrismaClient_1.prisma.review.findMany({ where: { productId }, select: { rating: true } });
        const total = reviews.length;
        const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => dist[r.rating] = (dist[r.rating] || 0) + 1);
        res.json({ averageRating: avg, totalReviews: total, distribution: dist });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/reviews (tạo review)
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { productId, rating, comment, images, variation, orderItemId } = req.body;
        const review = await PrismaClient_1.prisma.review.create({
            data: { userId: req.user.userId, productId, rating, comment, images, variation, orderItemId }
        });
        res.status(201).json(review);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/reviews/my
router.get('/my', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const reviews = await PrismaClient_1.prisma.review.findMany({
            where: { userId: req.user.userId }
        });
        res.json(reviews);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/reviews/:id
router.put('/:id', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { rating, comment, images } = req.body;
        // Ensure user owns the review
        const existing = await PrismaClient_1.prisma.review.findFirst({ where: { id, userId: req.user.userId } });
        if (!existing) {
            res.status(403).json({ message: 'Không có quyền sửa đánh giá này' });
            return;
        }
        const review = await PrismaClient_1.prisma.review.update({
            where: { id },
            data: { rating, comment, images }
        });
        res.json(review);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/reviews/:id/like
router.put('/:id/like', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Find existing review
        const review = await PrismaClient_1.prisma.review.findUnique({
            where: { id }
        });
        if (!review) {
            res.status(404).json({ error: 'Không tìm thấy đánh giá' });
            return;
        }
        // Just increment like count
        // In a more complex app, we'd check if user already liked it
        const updated = await PrismaClient_1.prisma.review.update({
            where: { id },
            data: { likes: review.likes + 1 }
        });
        res.json({ likes: updated.likes });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=review.routes.js.map