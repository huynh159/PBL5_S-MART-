import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(categories);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/categories (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description } = req.body;
        if (!name) { res.status(400).json({ error: 'Tên danh mục là bắt buộc' }); return; }
        const category = await prisma.category.create({ data: { name, description } });
        res.status(201).json(category);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/categories/:id (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const { name, description } = req.body;
        if (!name) { res.status(400).json({ error: 'Tên danh mục là bắt buộc' }); return; }
        
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) { res.status(404).json({ error: 'Không tìm thấy danh mục' }); return; }

        const category = await prisma.category.update({
            where: { id },
            data: { name, description }
        });
        res.json(category);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/categories/:id (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const existing = await prisma.category.findUnique({ 
            where: { id },
            include: { _count: { select: { products: true } } }
        });
        if (!existing) { res.status(404).json({ error: 'Không tìm thấy danh mục' }); return; }

        if (existing._count.products > 0) {
            res.status(400).json({ error: `Không thể xóa vì danh mục này đang chứa ${existing._count.products} sản phẩm. Hãy đổi danh mục cho các sản phẩm đó trước.` });
            return;
        }

        await prisma.category.delete({ where: { id } });
        res.json({ message: 'Đã xóa danh mục thành công' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
