import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/persistence/PrismaClient';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth.middleware';
import { getIO, onlineUsers } from '../../infrastructure/socket/socketService';

const router = Router();

// POST /api/orders/calculate-fee
router.post('/calculate-fee', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { province, district, ward, weight = 500 } = req.body;
        let shippingFee = 30000; // Default fallback
        let estimatedTime = '2-3 ngày';

        const ghtkToken = process.env.GHTK_TOKEN;
        const pickProvince = process.env.GHTK_PICK_PROVINCE || 'Đà Nẵng';
        const pickDistrict = process.env.GHTK_PICK_DISTRICT || 'Hải Châu';
        const pickWard = process.env.GHTK_PICK_WARD || 'Phường Thạch Thang';

        if (ghtkToken && province && district) {
            try {
                // Gọi API GHTK tĩnh phí vận chuyển
                const url = new URL('https://services.giaohangtietkiem.vn/services/shipment/fee');
                url.searchParams.append('pick_province', pickProvince);
                url.searchParams.append('pick_district', pickDistrict);
                url.searchParams.append('pick_ward', pickWard);
                url.searchParams.append('province', province);
                url.searchParams.append('district', district);
                url.searchParams.append('ward', ward || '');
                url.searchParams.append('weight', weight.toString());
                url.searchParams.append('deliver_option', 'none');

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: { 'Token': ghtkToken }
                });

                const data: any = await response.json();
                if (data && data.success) {
                    shippingFee = data.fee.fee;
                } else {
                    throw new Error('GHTK returned false success');
                }
            } catch (error: any) {
                console.error('[GHTK API Error] fallback applied:', error.message);
                // Fallback nếu GHTK lỗi hoặc sập mạng
                if (province.includes('Đà Nẵng')) shippingFee = 20000;
                else if (province.includes('Hà Nội') || province.includes('Hồ Chí Minh')) shippingFee = 30000;
                else shippingFee = 40000;
            }
        } else {
            // Fallback mặc định khi ko có Token
            if (province && province.includes('Đà Nẵng')) shippingFee = 20000;
            else if (province && (province.includes('Hà Nội') || province.includes('Hồ Chí Minh'))) shippingFee = 30000;
            else shippingFee = 40000;
        }

        res.json({ shippingFee, estimatedTime });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/orders  (l‹ch s ‘n hng ca user)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const orders = await prisma.order.findMany({
          where: { userId: req.user!.userId },
          include: { orderItems: { include: { product: true } }, coupon: true },
          orderBy: { createdAt: 'desc' }
        });
        // Add alias orderDetails for frontend compatibility
        const ordersWithDetails = orders.map(o => ({
          ...o,
          orderDetails: o.orderItems
        }));
        res.json(ordersWithDetails);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/orders/:id/cancel (hủy đơn hàng của user)
router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orderId = parseInt(String(req.params.id));
        if (Number.isNaN(orderId)) {
            res.status(400).json({ message: 'orderId không hợp lệ' });
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        });

        if (!order) {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            return;
        }
        if (order.userId !== req.user!.userId) {
            res.status(403).json({ message: 'Không có quyền thao tác đơn hàng này' });
            return;
        }

        const status = String(order.status).toUpperCase();
        // Chỉ cấm hủy khi đang giao (SHIPPING) trở đi
        if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(status)) {
            res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái hiện tại' });
            return;
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Hoàn kho
            for (const item of order.orderItems) {
                const productList: any[] = await tx.$queryRaw`SELECT * FROM "products" WHERE "id" = ${item.productId} FOR UPDATE`;
                if (!productList || productList.length === 0) continue;
                const product = productList[0];

                let updatedVariations = product.variations;
                if (product.variations && (item.color || item.size)) {
                    try {
                        const vars = JSON.parse(product.variations);
                        const varIndex = vars.findIndex((v: any) => v.color === item.color && v.size === item.size);
                        if (varIndex !== -1) {
                            vars[varIndex].stock = (vars[varIndex].stock || 0) + item.quantity;
                            updatedVariations = JSON.stringify(vars);
                        }
                    } catch {
                        // ignore invalid variations json
                    }
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        variations: updatedVariations
                    }
                });
            }

            // Hoàn mã giảm giá nếu có
            if (order.couponId) {
                await tx.coupon.update({
                    where: { id: order.couponId },
                    data: { quantity: { increment: 1 } }
                });
            }

            // Cập nhật trạng thái đơn hàng
            return await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' as any },
                include: { orderItems: { include: { product: true } }, coupon: true }
            });
        });

        const newNotif = await prisma.notification.create({
            data: {
                userId: req.user!.userId,
                content: `Đơn hàng #${updated.id} đã được hủy thành công.`,
                link: '/orders'
            }
        });

        getIO().to(`user_${req.user!.userId}`).emit('receiveNotification', newNotif);

        res.json(updated);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/orders  (tạo đơn hàng từ giỏ hàng)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { items, cartItemIds, directItems, address, phone, note, paymentMethod, couponCode, total, shippingFee } = req.body;
        if (!address || !phone) {
            res.status(400).json({ message: 'Thiếu thông tin giao hàng' });
            return;
        }

        let orderItemsInput: Array<{
            productId: number;
            quantity: number;
            color?: string | null;
            size?: string | null;
            price?: number;
        }> = [];

        if (Array.isArray(items) && items.length > 0) {
            orderItemsInput = items;
        } else if (Array.isArray(directItems) && directItems.length > 0) {
            orderItemsInput = directItems.map((item: any) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity) || 1,
                color: item.color || null,
                size: item.size || null,
                price: item.price ? Number(item.price) : undefined
            }));
        } else if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
            const selectedCartItems = await prisma.cartItem.findMany({
                where: {
                    userId: req.user!.userId,
                    id: { in: cartItemIds.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id)) }
                }
            });
            if (selectedCartItems.length === 0) {
                res.status(400).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng để thanh toán' });
                return;
            }
            orderItemsInput = selectedCartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                color: item.color || null,
                size: item.size || null,
                price: item.price
            }));
        }

        if (orderItemsInput.length === 0) {
            res.status(400).json({ message: 'Đơn hàng không có sản phẩm' });
            return;
        }

        let couponId: number | null = null;
        let couponDiscountPercent = 0;
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
            if (!coupon || !coupon.isActive || coupon.expiryDate < new Date() || coupon.quantity <= 0) {
                res.status(400).json({ message: 'Mã giảm giá không hợp lệ, đã hết hạn hoặc hết số lượng' });
                return;
            }
            couponId = coupon.id;
            couponDiscountPercent = coupon.discountPercent;
        }

        // Tạo Order kèm OrderItems (Prisma transaction)
        const order = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const resolvedItems: Array<{
                productId: number;
                quantity: number;
                color?: string | null;
                size?: string | null;
                price: number;
            }> = [];

            for (const item of orderItemsInput) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Sản phẩm #${item.productId} không tồn tại`);

                // Luôn lấy giá mới nhất từ DB, không dùng giá cũ trong giỏ hàng
                const unitPrice = product.salePrice ?? product.price;
                subtotal += unitPrice * item.quantity;
                resolvedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    color: item.color || null,
                    size: item.size || null,
                    price: unitPrice
                });
            }

            const computedTotal = Math.max(0, subtotal - Math.round(subtotal * couponDiscountPercent / 100));
            const finalShippingFee = typeof shippingFee === 'number' ? shippingFee : 0;
            // FIXED SECURITY VULNERABILITY: Do not trust `total` from frontend! Always calculate backend-side.
            const finalTotal = computedTotal + finalShippingFee;

            const newOrder = await tx.order.create({
                data: {
                    userId: req.user!.userId,
                    total: finalTotal,
                    shippingFee: finalShippingFee,
                    address,
                    phone,
                    note,
                    paymentMethod: paymentMethod || 'COD',
                    status: 'PENDING',
                    couponId
                }
            });

            // Giảm số lượng mã giảm giá
            if (couponId) {
                await tx.coupon.update({
                    where: { id: couponId },
                    data: { quantity: { decrement: 1 } }
                });
            }

            for (const item of resolvedItems) {
                // Khóa dòng sản phẩm để tránh tranh chấp (Race Condition)
                const productList: any[] = await tx.$queryRaw`SELECT * FROM "products" WHERE "id" = ${item.productId} FOR UPDATE`;
                if (!productList || productList.length === 0) throw new Error(`Sản phẩm #${item.productId} không tồn tại`);
                const product = productList[0];

                let updatedVariations = product.variations;
                if (product.variations) {
                    const vars = JSON.parse(product.variations);
                    const varIndex = vars.findIndex((v: any) => v.color === item.color && v.size === item.size);
                    if (varIndex !== -1) {
                        if (vars[varIndex].stock < item.quantity) throw new Error(`Biến thể ${item.color}/${item.size} của ${product.name} đã hết hàng`);
                        vars[varIndex].stock -= item.quantity;
                        updatedVariations = JSON.stringify(vars);
                    }
                }
                
                if (product.stock < item.quantity) throw new Error(`Sản phẩm ${product.name} đã hết hàng`);

                // Thực hiện trừ kho (Giữ chỗ)
                await tx.product.update({
                    where: { id: item.productId },
                    data: { 
                        stock: { decrement: item.quantity },
                        variations: updatedVariations
                    }
                });

                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        color: item.color,
                        size: item.size,
                        price: item.price
                    }
                });
            }

            // Xóa các sản phẩm đã đặt khỏi giỏ hàng
            if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
                await tx.cartItem.deleteMany({
                    where: {
                        userId: req.user!.userId,
                        id: { in: cartItemIds.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id)) }
                    }
                });
            }

            return newOrder;
        });


        // ---- THÊM THÔNG BÁO CHO QUẢN TRỊ VIÊN VÀO DATABASE ----
        if (paymentMethod !== 'VNPAY') {
            // Thông báo cho User
            const userNotif = await prisma.notification.create({
                data: {
                    userId: req.user!.userId,
                    content: `Đơn hàng #${order.id} đã được đặt thành công! Cảm ơn bạn.`,
                    link: '/orders'
                }
            });
            getIO().to(`user_${req.user!.userId}`).emit('receiveNotification', userNotif);

            const managers = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'STAFF'] } }
        });
        const adminNotifData = managers.map(admin => ({
            userId: admin.id,
            content: `Đơn hàng mới #${order.id} vừa được đặt!`,
            link: '/admin/orders'
        }));
        if (adminNotifData.length > 0) {
            await prisma.notification.createMany({ data: adminNotifData });
            // Lấy lại các thông báo vừa tạo để emit chính xác kèm id
            const createdNotifs = await prisma.notification.findMany({
                where: { userId: { in: managers.map(m => m.id) } },
                orderBy: { id: 'desc' },
                take: managers.length
            });
            // Gửi 'receiveNotification' đến từng manager online để đổ chuông NotificationDropdown
            for (const notif of createdNotifs) {
                getIO().to(`user_${notif.userId}`).emit('receiveNotification', notif);
            }
        }

        getIO().emit('adminNotification', { content: `Đơn hàng mới #${order.id} vừa được đặt!` });
        }

        res.status(201).json(order);
    } catch (e: any) {
        console.error("Create Order Error:", e);
        res.status(500).json({ error: e.message, message: 'Lỗi tạo đơn hàng: ' + e.message });
    }
});

// GET /api/coupons/apply/:code  (áp dụng mã giảm giá)
// Đặt ở đây vì frontend gọi qua order flow

export default router;
