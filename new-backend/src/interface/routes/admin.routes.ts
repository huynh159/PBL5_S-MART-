import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { getIO, onlineUsers } from '../../infrastructure/socket/socketService';

const router = Router();

// GET /api/admin/stats?year=2026&range=7d|30d|today|year|custom&startDate=...&endDate=...
router.get('/stats', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const year = parseInt(req.query['year'] as string) || new Date().getFullYear();
        const range = (req.query['range'] as string) || 'year';

        // Calculate date range for filtering
        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        switch (range) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                break;
            case '7d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case '30d':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'custom':
                startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : new Date(now.getFullYear(), 0, 1);
                endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : endDate;
                break;
            default: // 'year'
                startDate = new Date(year, 0, 1, 0, 0, 0, 0);
                endDate = new Date(year, 11, 31, 23, 59, 59, 999);
                break;
        }

        const orderFilter = {
            NOT: { AND: [{ paymentMethod: 'VNPAY' }, { status: 'PENDING' }] as any }
        };

        // Today boundaries for today-specific metrics
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const [
            totalRevenue, totalOrders, totalProducts, totalUsers,
            orderStatusStats, monthlyData, yearsRaw,
            todayRevenue, todayOrders, pendingOrders,
            topProductsRaw, recentOrders, lowStockProducts,
            newCustomers7d, topCustomersRaw
        ] = await Promise.all([
            // Core totals (filtered by range for DELIVERED orders)
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: 'DELIVERED', createdAt: { gte: startDate, lte: endDate } }
            }),
            prisma.order.count({
                where: { ...orderFilter, createdAt: { gte: startDate, lte: endDate } }
            }),
            prisma.product.count(),
            prisma.user.count(),
            // Order status breakdown (filtered by range)
            prisma.order.groupBy({
                by: ['status'],
                where: { ...orderFilter, createdAt: { gte: startDate, lte: endDate } },
                _count: { id: true }
            }),
            // Monthly revenue for chart
            prisma.$queryRaw<any[]>`
                SELECT EXTRACT(MONTH FROM created_at) as month, SUM(total) as revenue
                FROM orders 
                WHERE EXTRACT(YEAR FROM created_at) = ${year} AND status = 'DELIVERED'
                GROUP BY EXTRACT(MONTH FROM created_at)
                ORDER BY month ASC
            `,
            prisma.$queryRaw<any[]>`SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year FROM orders ORDER BY year DESC`,
            // Today's revenue
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: 'DELIVERED', createdAt: { gte: todayStart, lte: todayEnd } }
            }),
            // Today's orders count
            prisma.order.count({
                where: { ...orderFilter, createdAt: { gte: todayStart, lte: todayEnd } }
            }),
            // Pending orders count (all time)
            prisma.order.count({
                where: { status: { in: ['PENDING', 'PAID'] } }
            }),
            // Top 5 best-selling products (by quantity sold in DELIVERED orders within range)
            prisma.$queryRaw<any[]>`
                SELECT p.id, p.name, p."image_url" as "imageUrl", COALESCE(SUM(oi.quantity), 0)::int as "totalSold",
                       COALESCE(SUM(oi.quantity * oi.price), 0)::float as "totalRevenue"
                FROM products p
                JOIN order_items oi ON oi.product_id = p.id
                JOIN orders o ON o.id = oi.order_id
                WHERE o.status = 'DELIVERED' AND o.created_at >= ${startDate} AND o.created_at <= ${endDate}
                GROUP BY p.id, p.name, p."image_url"
                ORDER BY "totalSold" DESC
                LIMIT 5
            `,
            // Recent 8 orders
            prisma.order.findMany({
                where: orderFilter,
                take: 8,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, email: true } },
                    orderItems: { select: { quantity: true } }
                }
            }),
            // Low stock products (stock < 20)
            prisma.product.findMany({
                where: { stock: { lt: 20 }, status: 'ACTIVE' },
                select: { id: true, name: true, stock: true, imageUrl: true },
                orderBy: { stock: 'asc' },
                take: 8
            }),
            // New customers in last 7 days
            prisma.user.count({
                where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } }
            }),
            // Top 5 customers by total spending
            prisma.$queryRaw<any[]>`
                SELECT u.id, u.email, COUNT(o.id)::int as "orderCount", COALESCE(SUM(o.total), 0)::float as "totalSpent"
                FROM users u
                JOIN orders o ON o.user_id = u.id
                WHERE o.status = 'DELIVERED'
                GROUP BY u.id, u.email
                ORDER BY "totalSpent" DESC
                LIMIT 5
            `
        ]);

        // Format monthly revenue for recharts
        const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
        const revenueByMonth = months.map((m, i) => {
            const found = monthlyData.find((d: any) => Number(d.month) === (i + 1));
            return { month: m, revenue: found ? Number(found.revenue) : 0 };
        });

        res.json({
            totalRevenue: totalRevenue._sum.total || 0,
            todayRevenue: todayRevenue._sum.total || 0,
            totalOrders,
            todayOrders,
            pendingOrders,
            totalProducts,
            totalUsers,
            newCustomers7d,
            orderStatusStats: orderStatusStats.map(s => ({ name: s.status, value: s._count.id })),
            revenueByMonth,
            availableYears: yearsRaw.map((y: any) => Number(y.year)),
            selectedYear: year,
            topProducts: topProductsRaw.map((p: any) => ({
                id: Number(p.id), name: p.name, imageUrl: p.imageUrl,
                totalSold: Number(p.totalSold), totalRevenue: Number(p.totalRevenue)
            })),
            recentOrders: recentOrders.map(o => ({
                id: o.id, email: o.user?.email || 'N/A', total: o.total,
                status: o.status, paymentMethod: o.paymentMethod,
                createdAt: o.createdAt, itemCount: o.orderItems.reduce((s, i) => s + i.quantity, 0)
            })),
            lowStockProducts,
            topCustomers: topCustomersRaw.map((c: any) => ({
                id: Number(c.id), email: c.email,
                orderCount: Number(c.orderCount), totalSpent: Number(c.totalSpent)
            }))
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
