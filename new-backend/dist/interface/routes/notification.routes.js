"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const notifs = await PrismaClient_1.prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifs);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/notifications/:id/read
router.put('/:id/read', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const notif = await PrismaClient_1.prisma.notification.update({ where: { id }, data: { isRead: true } });
        res.json(notif);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map