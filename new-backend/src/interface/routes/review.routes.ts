import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.productId as string);
        const reviews = await prisma.review.findMany({
            where: { productId },
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/reviews/product/:productId/stats
router.get('/product/:productId/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const productId = parseInt(req.params.productId as string);
        const reviews = await prisma.review.findMany({ where: { productId }, select: { rating: true } });
        const total = reviews.length;
        const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => dist[r.rating] = (dist[r.rating] || 0) + 1);
        res.json({ averageRating: avg, totalReviews: total, distribution: dist });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/reviews (tạo review)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { productId, rating, comment, images, variation, orderItemId } = req.body;
        const review = await prisma.review.create({
            data: { userId: req.user!.userId, productId, rating, comment, images, variation, orderItemId }
        });
        res.status(201).json(review);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/reviews/my
router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reviews = await prisma.review.findMany({
            where: { userId: req.user!.userId }
        });
        res.json(reviews);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/reviews/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const { rating, comment, images } = req.body;

        // Ensure user owns the review
        const existing = await prisma.review.findFirst({ where: { id, userId: req.user!.userId } });
        if (!existing) {
            res.status(403).json({ message: 'Không có quyền sửa đánh giá này' });
            return;
        }

        const review = await prisma.review.update({
            where: { id },
            data: { rating, comment, images }
        });
        res.json(review);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/reviews/:id/like
router.put('/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);

        // Find existing review
        const review = await prisma.review.findUnique({
            where: { id }
        });

        if (!review) {
            res.status(404).json({ error: 'Không tìm thấy đánh giá' });
            return;
        }

        // Just increment like count
        // In a more complex app, we'd check if user already liked it
        const updated = await prisma.review.update({
            where: { id },
            data: { likes: review.likes + 1 }
        });

        res.json({ likes: updated.likes });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
