"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const socketService_1 = require("../../infrastructure/socket/socketService");
const router = (0, express_1.Router)();
// GET /api/chat/admin-id
router.get('/admin-id', async (_req, res) => {
    try {
        const admin = await PrismaClient_1.prisma.user.findFirst({ where: { role: 'ADMIN' } });
        res.json({ adminId: admin?.id || 1 });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/chat/send (lưu message vào DB, socket.io sẽ emit real-time)
router.post('/send', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        const receiverId = Number(req.body.receiverId);
        if (isNaN(receiverId)) {
            res.status(400).json({ error: 'receiverId không hợp lệ' });
            return;
        }
        const msg = await PrismaClient_1.prisma.message.create({
            data: { senderId: req.user.userId, receiverId, content, status: 'SENT' },
            include: { sender: { select: { id: true, email: true } } }
        });
        // Emit via socket
        (0, socketService_1.getIO)().to(`user_${receiverId}`).emit('receiveMessage', msg);
        res.status(201).json(msg);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/chat/history/:receiverId
router.get('/history/:receiverId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const receiverId = parseInt(req.params.receiverId);
        if (isNaN(receiverId)) {
            res.status(400).json({ error: 'receiverId không hợp lệ' });
            return;
        }
        const userId = req.user.userId;
        const messages = await PrismaClient_1.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId },
                    { senderId: receiverId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/chat/conversations (Admin: danh sách các cuộc hội thoại)
router.get('/conversations', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, async (req, res) => {
    try {
        const adminId = req.user.userId;
        const messages = await PrismaClient_1.prisma.message.findMany({
            where: { OR: [{ senderId: adminId }, { receiverId: adminId }] },
            include: { sender: { select: { id: true, email: true } }, receiver: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        // Group by user
        const convMap = new Map();
        messages.forEach(msg => {
            const otherId = msg.senderId === adminId ? msg.receiverId : msg.senderId;
            if (!convMap.has(otherId)) {
                const other = msg.senderId === adminId ? msg.receiver : msg.sender;
                convMap.set(otherId, { user: other, lastMessage: msg });
            }
        });
        res.json(Array.from(convMap.values()));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/chat/mark-seen/:senderId
router.put('/mark-seen/:senderId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const senderId = parseInt(req.params.senderId);
        if (isNaN(senderId)) {
            res.status(400).json({ error: 'senderId không hợp lệ' });
            return;
        }
        await PrismaClient_1.prisma.message.updateMany({
            where: { senderId, receiverId: req.user.userId, status: { not: 'SEEN' } },
            data: { status: 'SEEN' }
        });
        // Emit seen event to the original sender
        (0, socketService_1.getIO)().to(`user_${senderId}`).emit('seenEvent', { readerId: req.user.userId });
        res.json({ message: 'Đã đánh dấu đã xem' });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/chat/unread-count
router.get('/unread-count', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const count = await PrismaClient_1.prisma.message.count({
            where: { receiverId: req.user.userId, status: 'SENT' }
        });
        res.json({ unreadCount: count });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/chat/:id/recall
router.put('/:id/recall', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'ID không hợp lệ' });
            return;
        }
        const userId = req.user.userId;
        const msg = await PrismaClient_1.prisma.message.findUnique({ where: { id } });
        if (!msg) {
            res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
            return;
        }
        if (msg.senderId !== userId) {
            res.status(403).json({ error: 'Không có quyền thu hồi' });
            return;
        }
        const updatedMsg = await PrismaClient_1.prisma.message.update({
            where: { id },
            data: { content: 'Tin nhắn đã bị thu hồi', status: 'RECALLED' },
            include: { sender: { select: { id: true, email: true } } }
        });
        // Emit via socket
        (0, socketService_1.getIO)().to(`user_${updatedMsg.receiverId}`).emit('messageRecalled', updatedMsg);
        res.json({ message: 'Đã thu hồi tin nhắn', data: updatedMsg });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=chat.routes.js.map