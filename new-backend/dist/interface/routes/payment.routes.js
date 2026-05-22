"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const env_1 = require("../../infrastructure/config/env");
const router = (0, express_1.Router)();
const VNP_TMN_CODE = (0, env_1.getRequiredEnv)('VNP_TMN_CODE', 'sandbox-tmn-code');
const VNP_HASH_SECRET = (0, env_1.getRequiredEnv)('VNP_HASH_SECRET', 'sandbox-hash-secret');
const VNP_URL = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = (0, env_1.getRequiredEnv)('VNP_RETURN_URL', 'http://localhost:8080/api/payment/vnpay-callback');
const FRONTEND_BASE_URL = (0, env_1.getRequiredEnv)('FRONTEND_BASE_URL', 'http://localhost:3001');
/**
 * Tạo chuỗi ký (signData) theo chuẩn VNPay:
 *  - Sắp xếp key theo thứ tự bảng chữ cái
 *  - Encode value bằng encodeURIComponent (dấu cách thành %20, không thành +)
 *  - Nối bằng &
 * VNPay tính hash trên chuỗi này với HMAC-SHA512.
 */
function buildSignData(params) {
    return Object.keys(params)
        .sort()
        .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
        .join('&');
}
function hmacSha512(secretKey, data) {
    return crypto_1.default.createHmac('sha512', secretKey)
        .update(Buffer.from(data, 'utf-8'))
        .digest('hex');
}
// POST /api/payment/vnpay/create-payment?orderId=123
router.post('/vnpay/create-payment', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const orderId = parseInt(req.query['orderId']);
        if (Number.isNaN(orderId)) {
            res.status(400).json({ error: 'orderId không hợp lệ' });
            return;
        }
        const order = await PrismaClient_1.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
            return;
        }
        // ─── Ngày tạo theo GMT+7 ─────────────────────────────────────────────────
        const now = new Date();
        const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const createDate = gmt7.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
        // ─── Số tiền (VNPay nhân 100) ────────────────────────────────────────────
        const amount = Math.round(order.total * 100);
        // ─── Tham số gửi tới VNPay (CHƯA có vnp_SecureHash) ─────────────────────
        const vnpParams = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: VNP_TMN_CODE,
            vnp_Amount: amount.toString(),
            vnp_CurrCode: 'VND',
            vnp_TxnRef: `${orderId}_${Date.now()}`,
            vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Locale: 'vn',
            vnp_ReturnUrl: VNP_RETURN_URL,
            vnp_IpAddr: req.ip || '127.0.0.1',
            vnp_CreateDate: createDate,
        };
        // ─── Ký HMAC-SHA512 ──────────────────────────────────────────────────────
        const signData = buildSignData(vnpParams);
        const secureHash = hmacSha512(VNP_HASH_SECRET, signData);
        // ─── Thêm hash vào params rồi build URL ──────────────────────────────────
        // Thêm vnp_SecureHash SAU KHI ký (không ký trường này)
        const finalParams = {
            ...vnpParams,
            vnp_SecureHash: secureHash,
        };
        // Build URL với encodeURIComponent (giống buildSignData để tránh mismatch)
        const paymentUrl = VNP_URL + '?' + Object.keys(finalParams)
            .sort()
            .map((k) => `${k}=${encodeURIComponent(finalParams[k]).replace(/%20/g, '+')}`)
            .join('&');
        console.log('[VNPay] signData:', signData);
        console.log('[VNPay] secureHash:', secureHash);
        console.log('[VNPay] paymentUrl:', paymentUrl);
        res.json({ paymentUrl });
    }
    catch (e) {
        console.error('[VNPay] create-payment error:', e.message);
        res.status(500).json({ error: e.message });
    }
});
// GET /api/payment/vnpay-callback
router.get('/vnpay-callback', async (req, res) => {
    try {
        console.log('[VNPay] callback received:', req.query);
        // Lấy hash VNPay gửi về
        const params = {};
        for (const [k, v] of Object.entries(req.query)) {
            params[k] = v;
        }
        const receivedHash = params['vnp_SecureHash'];
        delete params['vnp_SecureHash'];
        delete params['vnp_SecureHashType'];
        // Tính lại hash – dùng cùng hàm buildSignData
        const signData = buildSignData(params);
        const calcHash = hmacSha512(VNP_HASH_SECRET, signData);
        console.log('[VNPay] signData (callback):', signData);
        console.log('[VNPay] calcHash:', calcHash);
        console.log('[VNPay] receivedHash:', receivedHash);
        if (calcHash.toLowerCase() !== (receivedHash || '').toLowerCase()) {
            console.warn('[VNPay] Chữ ký không hợp lệ!');
            res.redirect(`${FRONTEND_BASE_URL}/payment-status?status=FAILED`);
            return;
        }
        const responseCode = params['vnp_ResponseCode'];
        const txnRef = params['vnp_TxnRef'] || '';
        const orderId = parseInt(txnRef.split('_')[0]);
        if (responseCode === '00') {
            const updatedOrder = await PrismaClient_1.prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID' },
                include: { user: true }
            });
            console.log(`[VNPay] Order #${orderId} -> PAID (awaiting admin confirmation)`);
            // ---- THÔNG BÁO CHO USER VÀ ADMIN ----
            try {
                const { getIO } = require('../../infrastructure/socket/socketService');
                const userNotif = await PrismaClient_1.prisma.notification.create({
                    data: {
                        userId: updatedOrder.userId,
                        content: `Đơn hàng #${orderId} đã thanh toán thành công! Đơn hàng đang chờ xác nhận từ cửa hàng.`,
                        link: '/orders'
                    }
                });
                getIO().to(`user_${updatedOrder.userId}`).emit('receiveNotification', userNotif);
                const managers = await PrismaClient_1.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'STAFF'] } } });
                const adminNotifData = managers.map(admin => ({
                    userId: admin.id,
                    content: `Đơn hàng #${orderId} đã thanh toán qua VNPay! Chờ xác nhận.`,
                    link: '/admin/orders'
                }));
                if (adminNotifData.length > 0) {
                    await PrismaClient_1.prisma.notification.createMany({ data: adminNotifData });
                    const createdNotifs = await PrismaClient_1.prisma.notification.findMany({
                        where: { userId: { in: managers.map(m => m.id) } },
                        orderBy: { id: 'desc' },
                        take: managers.length
                    });
                    for (const notif of createdNotifs) {
                        getIO().to(`user_${notif.userId}`).emit('receiveNotification', notif);
                    }
                }
                getIO().emit('adminNotification', { content: `Đơn hàng #${orderId} đã thanh toán thành công!` });
            }
            catch (err) {
                console.error('[VNPay Notification Error]', err);
            }
            res.redirect(`${FRONTEND_BASE_URL}/payment-status?status=SUCCESS&orderId=${orderId}`);
        }
        else {
            console.log(`[VNPay] Payment failed, responseCode=${responseCode}. Reverting stock...`);
            try {
                // ---- LOGIC HOÀN KHO KHI THANH TOÁN THẤT BẠI ----
                const order = await PrismaClient_1.prisma.order.findUnique({
                    where: { id: orderId },
                    include: { orderItems: true }
                });
                if (order && order.status === 'PENDING') {
                    await PrismaClient_1.prisma.$transaction(async (tx) => {
                        for (const item of order.orderItems) {
                            // Khóa dòng sản phẩm để tránh race condition khi hoàn kho
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
                                catch (e) { }
                            }
                            await tx.product.update({
                                where: { id: item.productId },
                                data: {
                                    stock: { increment: item.quantity },
                                    variations: updatedVariations
                                }
                            });
                        }
                        if (order.couponId) {
                            await tx.coupon.update({
                                where: { id: order.couponId },
                                data: { quantity: { increment: 1 } }
                            });
                        }
                        await tx.order.update({
                            where: { id: orderId },
                            data: { status: 'CANCELLED' }
                        });
                    });
                    console.log(`[VNPay] Order #${orderId} cancelled and stock reverted.`);
                    // ---- THÔNG BÁO CHO USER KHI THANH TOÁN THẤT BẠI ----
                    try {
                        const { getIO } = require('../../infrastructure/socket/socketService');
                        const userNotif = await PrismaClient_1.prisma.notification.create({
                            data: {
                                userId: order.userId,
                                content: `Thanh toán VNPay cho đơn hàng #${orderId} thất bại. Đơn hàng đã bị hủy và tồn kho đã được hoàn lại.`,
                                link: '/orders'
                            }
                        });
                        getIO().to(`user_${order.userId}`).emit('receiveNotification', userNotif);
                    }
                    catch (notifErr) {
                        console.error('[VNPay Failed Notification Error]', notifErr);
                    }
                }
            }
            catch (revertError) {
                console.error('[VNPay Revert Stock Error]', revertError);
            }
            res.redirect(`${FRONTEND_BASE_URL}/payment-status?status=FAILED&orderId=${orderId}`);
        }
    }
    catch (e) {
        console.error('[VNPay] callback error:', e.message);
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
//# sourceMappingURL=payment.routes.js.map