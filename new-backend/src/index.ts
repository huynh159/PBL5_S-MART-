import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { initSocket } from './infrastructure/socket/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───────────────────────────────────────────
import authRoutes from './interface/routes/auth.routes';
import productRoutes from './interface/routes/product.routes';
import categoryRoutes from './interface/routes/category.routes';
import cartRoutes from './interface/routes/cart.routes';
import orderRoutes from './interface/routes/order.routes';
import couponRoutes from './interface/routes/coupon.routes';
import reviewRoutes from './interface/routes/review.routes';
import notificationRoutes from './interface/routes/notification.routes';
import adminRoutes from './interface/routes/admin.routes';
import uploadRoutes from './interface/routes/upload.routes';
import chatRoutes from './interface/routes/chat.routes';
import paymentRoutes from './interface/routes/payment.routes';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'Sport Shop API (Node.js + TypeScript) is running!' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
