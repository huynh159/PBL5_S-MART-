import { Router, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/cart
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const items = await prisma.cartItem.findMany({
            where: { userId: req.user!.userId },
            include: { product: { include: { images: true } } }
        });

        // Tự động cập nhật giá trong giỏ hàng theo giá mới nhất của sản phẩm
        const updatedItems = [];
        for (const item of items) {
            const currentPrice = item.product.salePrice ?? item.product.price;
            if (item.price !== currentPrice) {
                // Giá sản phẩm đã thay đổi → cập nhật lại giá trong giỏ hàng
                await prisma.cartItem.update({
                    where: { id: item.id },
                    data: { price: currentPrice }
                });
                updatedItems.push({
                    ...item,
                    oldPrice: item.price,
                    price: currentPrice,
                    priceChanged: true
                });
            } else {
                updatedItems.push({ ...item, priceChanged: false });
            }
        }

        res.json(updatedItems);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/cart
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { productId, quantity, color, size, price } = req.body;
        // Kiểm tra tồn kho (Domain Invariant: Cart check stock)
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) { res.status(404).json({ error: 'Sản phẩm không tồn tại' }); return; }
        if (product.stock < quantity) { res.status(400).json({ error: 'Tồn kho không đủ' }); return; }

        const item = await prisma.cartItem.create({
            data: { userId: req.user!.userId, productId, quantity, color, size, price }
        });
        res.status(201).json(item);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/cart/:id?quantity=2
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const quantity = parseInt(req.query['quantity'] as string);
        const item = await prisma.cartItem.update({ where: { id }, data: { quantity } });
        res.json(item);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/cart/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        await prisma.cartItem.delete({ where: { id } });
        res.json({ message: 'Đã xóa khỏi giỏ hàng' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/cart/clear
router.delete('/clear', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
        res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
