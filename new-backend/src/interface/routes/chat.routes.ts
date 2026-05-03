import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { getIO, onlineUsers } from '../../infrastructure/socket/socketService';

const router = Router();

// GET /api/chat/admin-id
router.get('/admin-id', async (_req: Request, res: Response): Promise<void> => {
    try {
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        res.json({ adminId: admin?.id || 1 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/chat/send (lưu message vào DB, socket.io sẽ emit real-time)
router.post('/send', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content } = req.body;
        const receiverId = Number(req.body.receiverId);
        if (isNaN(receiverId)) { res.status(400).json({ error: 'receiverId không hợp lệ' }); return; }
        const msg = await prisma.message.create({
            data: { senderId: req.user!.userId, receiverId, content, status: 'SENT' },
            include: { sender: { select: { id: true, email: true } } }
        });
        
        // Emit via socket
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
            getIO().to(receiverSocketId).emit('receiveMessage', msg);
        }
        
        res.status(201).json(msg);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/chat/history/:receiverId
router.get('/history/:receiverId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const receiverId = parseInt(req.params.receiverId as string);
        if (isNaN(receiverId)) { res.status(400).json({ error: 'receiverId không hợp lệ' }); return; }
        const userId = req.user!.userId;
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId },
                    { senderId: receiverId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/chat/conversations (Admin: danh sách các cuộc hội thoại)
router.get('/conversations', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.userId;
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: adminId }, { receiverId: adminId }] },
            include: { sender: { select: { id: true, email: true } }, receiver: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        // Group by user
        const convMap = new Map<number, any>();
        messages.forEach(msg => {
            const otherId = msg.senderId === adminId ? msg.receiverId : msg.senderId;
            if (!convMap.has(otherId)) {
                const other = msg.senderId === adminId ? msg.receiver : msg.sender;
                convMap.set(otherId, { user: other, lastMessage: msg });
            }
        });
        res.json(Array.from(convMap.values()));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/chat/mark-seen/:senderId
router.put('/mark-seen/:senderId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const senderId = parseInt(req.params.senderId as string);
        if (isNaN(senderId)) { res.status(400).json({ error: 'senderId không hợp lệ' }); return; }
        await prisma.message.updateMany({
            where: { senderId, receiverId: req.user!.userId, status: { not: 'SEEN' } },
            data: { status: 'SEEN' }
        });
        
        // Emit seen event to the original sender
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
            getIO().to(senderSocketId).emit('seenEvent', { readerId: req.user!.userId });
        }
        
        res.json({ message: 'Đã đánh dấu đã xem' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
