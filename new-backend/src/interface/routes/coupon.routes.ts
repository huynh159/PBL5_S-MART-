import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/coupons (Admin)
router.get('/', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
        res.json(await prisma.coupon.findMany({ orderBy: { id: 'desc' } }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/coupons/apply/:code (User)
router.get('/apply/:code', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const coupon = await prisma.coupon.findUnique({ where: { code: req.params.code as string } });
        if (!coupon || !coupon.isActive || coupon.expiryDate < new Date()) {
            res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' }); return;
        }
        res.json(coupon);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/coupons (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = { ...req.body };
        if (data.expiryDate) {
            data.expiryDate = new Date(data.expiryDate);
        }
        if (typeof data.discountPercent !== 'undefined') {
            data.discountPercent = Number(data.discountPercent);
        }

        // Cehck existing
        const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
        if (existing) {
             res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
             return;
        }

        const coupon = await prisma.coupon.create({ data });
        res.status(201).json(coupon);
    } catch (e: any) { res.status(500).json({ error: e.message || 'Lỗi server' }); }
});

// PUT /api/coupons/:id (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const data = { ...req.body };
        if (data.expiryDate) {
            data.expiryDate = new Date(data.expiryDate);
        }
        if (typeof data.discountPercent !== 'undefined') {
            data.discountPercent = Number(data.discountPercent);
        }
        delete data.id; // ensure ID is not passed to data update

        const coupon = await prisma.coupon.update({ where: { id }, data });
        res.json(coupon);
    } catch (e: any) { res.status(500).json({ error: e.message || 'Lỗi server' }); }
});

// DELETE /api/coupons/:id (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await prisma.coupon.delete({ where: { id } });
        res.json({ message: 'Đã xóa mã giảm giá' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
