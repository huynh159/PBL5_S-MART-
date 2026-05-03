import { Router, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifs = await prisma.notification.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifs);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const notif = await prisma.notification.update({ where: { id }, data: { isRead: true } });
        res.json(notif);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
