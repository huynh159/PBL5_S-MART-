"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const PrismaClient_1 = require("../../infrastructure/persistence/PrismaClient");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const VNP_TMN_CODE = process.env.VNP_TMN_CODE || '4PFYZUNE';
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || '70RUDI5QSBEWD49R0DDOU4GCKQZ4ARHQ';
const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = process.env.VNP_RETURN_URL || 'http://localhost:8080/api/payment/vnpay-callback';
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3001';
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
            await PrismaClient_1.prisma.order.update({
                where: { id: orderId },
                data: { status: 'CONFIRMED' },
            });
            console.log(`[VNPay] Order #${orderId} -> CONFIRMED`);
            res.redirect(`${FRONTEND_BASE_URL}/payment-status?status=SUCCESS&orderId=${orderId}`);
        }
        else {
            console.log(`[VNPay] Payment failed, responseCode=${responseCode}`);
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