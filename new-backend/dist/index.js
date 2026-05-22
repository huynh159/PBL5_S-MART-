"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const socketService_1 = require("./infrastructure/socket/socketService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.set('trust proxy', 1);
// Initialize Socket.io
(0, socketService_1.initSocket)(server);
// Start Order Cleanup Service (Auto-release stock for expired payments)
const OrderCleanupService_1 = require("./infrastructure/services/OrderCleanupService");
if (process.env.DISABLE_ORDER_CLEANUP !== 'true') {
    OrderCleanupService_1.OrderCleanupService.start();
}
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_BASE_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.resolve(process.cwd(), 'uploads')));
// â”€â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const auth_routes_1 = __importDefault(require("./interface/routes/auth.routes"));
const product_routes_1 = __importDefault(require("./interface/routes/product.routes"));
const category_routes_1 = __importDefault(require("./interface/routes/category.routes"));
const cart_routes_1 = __importDefault(require("./interface/routes/cart.routes"));
const order_routes_1 = __importDefault(require("./interface/routes/order.routes"));
const coupon_routes_1 = __importDefault(require("./interface/routes/coupon.routes"));
const review_routes_1 = __importDefault(require("./interface/routes/review.routes"));
const notification_routes_1 = __importDefault(require("./interface/routes/notification.routes"));
const admin_routes_1 = __importDefault(require("./interface/routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./interface/routes/upload.routes"));
const chat_routes_1 = __importDefault(require("./interface/routes/chat.routes"));
const payment_routes_1 = __importDefault(require("./interface/routes/payment.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/cart', cart_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/coupons', coupon_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
app.get('/', (_req, res) => {
    res.json({ message: 'Sport Shop API (Node.js + TypeScript) is running!' });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=index.js.map