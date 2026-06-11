import { prisma } from '../persistence/PrismaClient';

/**
 * OrderCleanupService
 * Quét và hủy các đơn hàng VNPay quá hạn thanh toán để hoàn kho.
 */
export class OrderCleanupService {
    private static INTERVAL_MS = 30 * 1000; // Kiểm tra mỗi 30 giây để đảm bảo chính xác hơn
    private static EXPIRY_MINUTES = 15;     // Hết hạn sau 15 phút

    static start() {
        console.log('🚀 Order Cleanup Service started (Interval: 1 min)');
        setInterval(() => this.cleanup(), this.INTERVAL_MS);
    }

    private static async cleanup() {
        try {
            const expiryDate = new Date(Date.now() - this.EXPIRY_MINUTES * 60 * 1000);

            // Tìm các đơn hàng VNPAY, trạng thái PENDING và đã quá 15 phút
            const expiredOrders = await prisma.order.findMany({
                where: {
                    paymentMethod: 'VNPAY',
                    status: 'PENDING',
                    createdAt: { lt: expiryDate }
                },
                include: { orderItems: true }
            });

            if (expiredOrders.length === 0) return;

            console.log(`🧹 Found ${expiredOrders.length} expired VNPay orders. Cleaning up...`);

            for (const order of expiredOrders) {
                await prisma.$transaction(async (tx) => {
                    // 1. Hoàn kho cho từng sản phẩm và biến thể
                    for (const item of order.orderItems) {
                        // Khóa dòng sản phẩm để tránh race condition khi hoàn kho
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
                            } catch (e) { }
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

                    // 2. Chuyển trạng thái đơn hàng sang CANCELLED
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: 'CANCELLED' as any }
                    });

                    // 3. Tạo thông báo cho user (Tùy chọn)
                    await tx.notification.create({
                        data: {
                            userId: order.userId,
                            content: `Đơn hàng #${order.id} của bạn đã bị hủy do hết hạn thanh toán (15 phút).`,
                            link: '/orders'
                        }
                    });
                });
                console.log(`   ✅ Order #${order.id} cancelled and stock reverted.`);
            }
        } catch (error) {
            console.error('❌ Order Cleanup Error:', error);
        }
    }
}
