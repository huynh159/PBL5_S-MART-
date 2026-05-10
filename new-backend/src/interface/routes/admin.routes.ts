import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { getIO, onlineUsers } from '../../infrastructure/socket/socketService';

const router = Router();

// GET /api/admin/stats?year=2026
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const year = parseInt(req.query['year'] as string) || new Date().getFullYear();
        
        const [totalRevenue, totalOrders, totalProducts, totalUsers, orderStatusStats, monthlyData, yearsRaw] = await Promise.all([
            prisma.order.aggregate({ _sum: { total: true }, where: { status: 'DELIVERED' } }),
            prisma.order.count({
                where: {
                    NOT: {
                        AND: [{ paymentMethod: 'VNPAY' }, { status: 'PENDING' }]
                    }
                }
            }),
            prisma.product.count(),
            prisma.user.count(),
            prisma.order.groupBy({
                by: ['status'],
                where: {
                    NOT: {
                        AND: [{ paymentMethod: 'VNPAY' }, { status: 'PENDING' }]
                    }
                },
                _count: { id: true }
            }),
            prisma.$queryRaw<any[]>`
                SELECT EXTRACT(MONTH FROM created_at) as month, SUM(total) as revenue
                FROM orders 
                WHERE EXTRACT(YEAR FROM created_at) = ${year} AND status = 'DELIVERED'
                GROUP BY EXTRACT(MONTH FROM created_at)
                ORDER BY month ASC
            `,
            prisma.$queryRaw<any[]>`SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year FROM orders ORDER BY year DESC`
        ]);

        // Format monthly revenue for recharts
        const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        const revenueByMonth = months.map((m, i) => {
            const found = monthlyData.find(d => Number(d.month) === (i + 1));
            return { month: m, revenue: found ? Number(found.revenue) : 0 };
        });

        res.json({
            totalRevenue: totalRevenue._sum.total || 0,
            totalOrders,
            totalProducts,
            totalUsers,
            orderStatusStats: orderStatusStats.map(s => ({ name: s.status, value: s._count.id })),
            revenueByMonth,
            availableYears: yearsRaw.map(y => Number(y.year)),
            selectedYear: year
        });
    } catch (e: any) { 
        console.error('Stats Error:', e);
        res.status(500).json({ error: e.message }); 
    }
});

// GET /api/admin/users
router.get('/users', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, status: true, isVerified: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/users/:id/toggle-lock
router.put('/users/:id/toggle-lock', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) { res.status(404).json({ error: 'User khng t“n ti' }); return; }
        const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
        const updated = await prisma.user.update({ where: { id }, data: { status: newStatus } });

        if (newStatus === 'LOCKED') {
            getIO().to(`user_${id}`).emit('forceLogout', { message: 'Tài khoản của bạn đã bị khóa bởi Admin!' });
        }

        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/orders
router.get('/orders', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                NOT: {
                    AND: [
                        { paymentMethod: 'VNPAY' },
                        { status: 'PENDING' }
                    ]
                }
            },
            include: { user: { select: { id: true, email: true } }, orderItems: { include: { product: true } }, coupon: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/orders/:id/status  (cập nhật trạng thái đơn hàng - State Machine)
router.put('/orders/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const { status } = req.body;
        const VALID_TRANSITIONS: Record<string, string[]> = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            PAID: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['SHIPPING', 'CANCELLED'],
            SHIPPING: ['DELIVERED'],
            DELIVERED: [], CANCELLED: []
        };
        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) { res.status(404).json({ error: 'Không tìm thấy đơn hàng' }); return; }
        if (!VALID_TRANSITIONS[order.status]?.includes(status)) {
            res.status(400).json({ error: `Không thể chuyển từ ${order.status} sang ${status}` }); return;
        }
        const updated = await prisma.order.update({ where: { id }, data: { status } });

        // Gửi thông báo cho user (Tạo record DB để người dùng xem lại ở chuông thông báo)
        let message = `Đơn hàng #${id} đã được cập nhật trạng thái mới.`;
        if (status === 'CONFIRMED') message = `Đơn hàng #${id} của bạn đã được xác nhận và đang chuẩn bị.`;
        else if (status === 'SHIPPING') message = `Đơn hàng #${id} của bạn đang được giao.`;
        else if (status === 'DELIVERED') message = `Đơn hàng #${id} của bạn đã giao thành công.`;
        else if (status === 'CANCELLED') message = `Đơn hàng #${id} của bạn đã bị hủy.`;

        const newNotif = await prisma.notification.create({
            data: {
                userId: order.userId,
                content: message,
                link: '/orders'
            }
        });

        // Gửi qua room thay vì check SocketId cụ thể để hỗ trợ đa kết nối (nhiều tab)
        getIO().to(`user_${order.userId}`).emit('receiveNotification', newNotif);

        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/coupons
router.get('/coupons', authMiddleware, adminMiddleware, async (_req: Request, res: Response): Promise<void> => {
    try {
        res.json(await prisma.coupon.findMany({ orderBy: { id: 'desc' } }));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/coupons
router.post('/coupons', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const data = { ...req.body };
        if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
        if (data.discountPercent) data.discountPercent = Number(data.discountPercent);
        if (data.quantity !== undefined) data.quantity = Number(data.quantity);

        let existing = await prisma.coupon.findUnique({ where: { code: data.code }});
        if (existing) {
             res.status(400).json({ error: 'Mã giảm giá đã tồn tại!' });
             return;
        }

        const coupon = await prisma.coupon.create({ data });
        res.status(201).json(coupon);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const data = { ...req.body };
        if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
        if (data.discountPercent) data.discountPercent = Number(data.discountPercent);
        if (data.quantity !== undefined) data.quantity = Number(data.quantity);

        // Remove `id` just in case it's passed in body to prevent update issues
        delete data.id;

        const updated = await prisma.coupon.update({ where: { id }, data });
        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/admin/coupons/:id/toggle
router.put('/coupons/:id/toggle', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const coupon = await prisma.coupon.findUnique({ where: { id } });
        if (!coupon) { res.status(404).json({ error: 'Không tìm thấy coupon' }); return; }
        const updated = await prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
        res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
