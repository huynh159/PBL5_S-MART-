import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
