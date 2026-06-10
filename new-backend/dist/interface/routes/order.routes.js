"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const socketService_1 = require("../../infrastructure/socket/socketService");
const router = (0, express_1.Router)();
// POST /api/orders/calculate-fee
router.post('/calculate-fee', auth_middleware_1.authMiddleware, async (req, res) => {
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
                const data = await response.json();
                if (data && data.success) {
                    shippingFee = data.fee.fee;
                }
                else {
                    throw new Error('GHTK returned false success');
                }
            }
            catch (error) {
                console.error('[GHTK API Error] fallback applied:', error.message);
                // Fallback nếu GHTK lỗi hoặc sập mạng
                if (province.includes('Đà Nẵng'))
                    shippingFee = 20000;
                else if (province.includes('Hà Nội') || province.includes('Hồ Chí Minh'))
                    shippingFee = 30000;
                else
                    shippingFee = 40000;
            }
        }
        else {
            // Fallback mặc định khi ko có Token
            if (province && province.includes('Đà Nẵng'))
                shippingFee = 20000;
            else if (province && (province.includes('Hà Nội') || province.includes('Hồ Chí Minh')))
                shippingFee = 30000;
            else
                shippingFee = 40000;
        }
        res.json({ shippingFee, estimatedTime });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/orders  (l‹ch s ‘n hng ca user)
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const orders = await PrismaClient_1.prisma.order.findMany({
            where: { userId: req.user.userId },
            include: { orderItems: { include: { product: true } }, coupon: true },
            orderBy: { createdAt: 'desc' }
        });
        // Add alias orderDetails for frontend compatibility
        const ordersWithDetails = orders.map(o => ({
            ...o,
            orderDetails: o.orderItems
        }));
        res.json(ordersWithDetails);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/orders/:id/cancel (hủy đơn hàng của user)
router.put('/:id/cancel', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const orderId = parseInt(String(req.params.id));
        if (Number.isNaN(orderId)) {
            res.status(400).json({ message: 'orderId không hợp lệ' });
            return;
        }
        const order = await PrismaClient_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        });
        if (!order) {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            return;
        }
        if (order.userId !== req.user.userId) {
            res.status(403).json({ message: 'Không có quyền thao tác đơn hàng này' });
            return;
        }
        const status = String(order.status).toUpperCase();
        // Chỉ cấm hủy khi đang giao (SHIPPING) trở đi
        if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(status)) {
            res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái hiện tại' });
            return;
        }
        const updated = await PrismaClient_1.prisma.$transaction(async (tx) => {
            // Hoàn kho
            for (const item of order.orderItems) {
                const productList = await tx.$queryRaw `SELECT * FROM "products" WHERE "id" = ${item.productId} FOR UPDATE`;
                if (!productList || productList.length === 0)
                    continue;
                const product = productList[0];
                let updatedVariations = product.variations;
                if (product.variations && (item.color || item.size)) {
                    try {
                        const vars = JSON.parse(product.variations);
                        const varIndex = vars.findIndex((v) => v.color === item.color && v.size === item.size);
                        if (varIndex !== -1) {
                            vars[varIndex].stock = (vars[varIndex].stock || 0) + item.quantity;
                            updatedVariations = JSON.stringify(vars);
                        }
                    }
                    catch {
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
                data: { status: 'CANCELLED' },
                include: { orderItems: { include: { product: true } }, coupon: true }
            });
        });
        const newNotif = await PrismaClient_1.prisma.notification.create({
            data: {
                userId: req.user.userId,
                content: `Đơn hàng #${updated.id} đã được hủy thành công.`,
                link: '/orders'
            }
        });
        (0, socketService_1.getIO)().to(`user_${req.user.userId}`).emit('receiveNotification', newNotif);
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/orders  (tạo đơn hàng từ giỏ hàng)
router.post('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const { items, cartItemIds, directItems, address, phone, note, paymentMethod, couponCode, total, shippingFee } = req.body;
        if (!address || !phone) {
            res.status(400).json({ message: 'Thiếu thông tin giao hàng' });
            return;
        }
        let orderItemsInput = [];
        if (Array.isArray(items) && items.length > 0) {
            orderItemsInput = items;
        }
        else if (Array.isArray(directItems) && directItems.length > 0) {
            orderItemsInput = directItems.map((item) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity) || 1,
                color: item.color || null,
                size: item.size || null,
                price: item.price ? Number(item.price) : undefined
            }));
        }
        else if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
            const selectedCartItems = await PrismaClient_1.prisma.cartItem.findMany({
                where: {
                    userId: req.user.userId,
                    id: { in: cartItemIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)) }
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
        let couponId = null;
        let couponDiscountPercent = 0;
        if (couponCode) {
            const coupon = await PrismaClient_1.prisma.coupon.findUnique({ where: { code: couponCode } });
            if (!coupon || !coupon.isActive || coupon.expiryDate < new Date() || coupon.quantity <= 0) {
                res.status(400).json({ message: 'Mã giảm giá không hợp lệ, đã hết hạn hoặc hết số lượng' });
                return;
            }
            couponId = coupon.id;
            couponDiscountPercent = coupon.discountPercent;
        }
        // Tạo Order kèm OrderItems (Prisma transaction)
        const order = await PrismaClient_1.prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const resolvedItems = [];
            for (const item of orderItemsInput) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product)
                    throw new Error(`Sản phẩm #${item.productId} không tồn tại`);
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
                    userId: req.user.userId,
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
                const productList = await tx.$queryRaw `SELECT * FROM "products" WHERE "id" = ${item.productId} FOR UPDATE`;
                if (!productList || productList.length === 0)
                    throw new Error(`Sản phẩm #${item.productId} không tồn tại`);
                const product = productList[0];
                let updatedVariations = product.variations;
                if (product.variations) {
                    const vars = JSON.parse(product.variations);
                    const varIndex = vars.findIndex((v) => v.color === item.color && v.size === item.size);
                    if (varIndex !== -1) {
                        if (vars[varIndex].stock < item.quantity)
                            throw new Error(`Biến thể ${item.color}/${item.size} của ${product.name} đã hết hàng`);
                        vars[varIndex].stock -= item.quantity;
                        updatedVariations = JSON.stringify(vars);
                    }
                }
                if (product.stock < item.quantity)
                    throw new Error(`Sản phẩm ${product.name} đã hết hàng`);
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
                        userId: req.user.userId,
                        id: { in: cartItemIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)) }
                    }
                });
            }
            return newOrder;
        });
        // ---- THÊM THÔNG BÁO CHO QUẢN TRỊ VIÊN VÀO DATABASE ----
        if (paymentMethod !== 'VNPAY') {
            // Thông báo cho User
            const userNotif = await PrismaClient_1.prisma.notification.create({
                data: {
                    userId: req.user.userId,
                    content: `Đơn hàng #${order.id} đã được đặt thành công! Cảm ơn bạn.`,
                    link: '/orders'
                }
            });
            (0, socketService_1.getIO)().to(`user_${req.user.userId}`).emit('receiveNotification', userNotif);
            const managers = await PrismaClient_1.prisma.user.findMany({
                where: { role: { in: ['ADMIN', 'STAFF'] } }
            });
            const adminNotifData = managers.map(admin => ({
                userId: admin.id,
                content: `Đơn hàng mới #${order.id} vừa được đặt!`,
                link: '/admin/orders'
            }));
            if (adminNotifData.length > 0) {
                await PrismaClient_1.prisma.notification.createMany({ data: adminNotifData });
                // Lấy lại các thông báo vừa tạo để emit chính xác kèm id
                const createdNotifs = await PrismaClient_1.prisma.notification.findMany({
                    where: { userId: { in: managers.map(m => m.id) } },
                    orderBy: { id: 'desc' },
                    take: managers.length
                });
                // Gửi 'receiveNotification' đến từng manager online để đổ chuông NotificationDropdown
                for (const notif of createdNotifs) {
                    (0, socketService_1.getIO)().to(`user_${notif.userId}`).emit('receiveNotification', notif);
                }
            }
            (0, socketService_1.getIO)().emit('adminNotification', { content: `Đơn hàng mới #${order.id} vừa được đặt!` });
        }
        res.status(201).json(order);
    }
    catch (e) {
        console.error("Create Order Error:", e);
        res.status(500).json({ error: e.message, message: 'Lỗi tạo đơn hàng: ' + e.message });
    }
});
// GET /api/coupons/apply/:code  (áp dụng mã giảm giá)
// Đặt ở đây vì frontend gọi qua order flow
exports.default = router;
//# sourceMappingURL=order.routes.js.map