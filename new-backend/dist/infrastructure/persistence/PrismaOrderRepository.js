"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaOrderRepository = void 0;
const Order_1 = require("../../domain/entities/Order");
const PrismaClient_1 = require("./PrismaClient");
class PrismaOrderRepository {
    async findById(id) {
        const row = await PrismaClient_1.prisma.order.findUnique({
            where: { id: parseInt(id) }
        });
        if (!row)
            return null;
        // Cần map dữ liệu row sang Entity Order. 
        // Trong dự án thực tế ta sẽ load cả OrderItem và dùng Reflection/Factory.
        // Đây là ví dụ trả về mock.
        return null;
    }
    async save(order) {
        let statusStr = "PENDING";
        switch (order.getStatus()) {
            case Order_1.OrderStatus.CONFIRMED:
                statusStr = "CONFIRMED";
                break;
            case Order_1.OrderStatus.SHIPPING:
                statusStr = "SHIPPING";
                break;
            case Order_1.OrderStatus.DELIVERED:
                statusStr = "DELIVERED";
                break;
            case Order_1.OrderStatus.CANCELLED:
                statusStr = "CANCELLED";
                break;
        }
        // Tạo order và lưu kèm OrderItems (sử dụng transaction của Prisma)
        // Lưu ý: customerId trong Entity lúc này là chuỗi, nhưng DB lưu Int, 
        // ở mức production cần có mapper chuyên biệt.
        const cId = parseInt(order.customerId) || 1;
        const items = order.getItems();
        const products = await PrismaClient_1.prisma.product.findMany({
            where: { sku: { in: items.map(i => i.sku) } },
            select: { id: true, sku: true }
        });
        const productIdBySku = new Map(products.map(p => [p.sku, p.id]));
        await PrismaClient_1.prisma.order.create({
            data: {
                userId: cId,
                total: order.totalAmount().amount,
                status: statusStr,
                address: "N/A",
                phone: "N/A",
                orderItems: {
                    create: items.map(i => {
                        const productId = productIdBySku.get(i.sku);
                        if (!productId) {
                            throw new Error(`Khong tim thay san pham voi SKU: ${i.sku}`);
                        }
                        return {
                            productId,
                            quantity: i.quantity,
                            price: i.unitPrice.amount
                        };
                    })
                }
            }
        });
    }
}
exports.PrismaOrderRepository = PrismaOrderRepository;
//# sourceMappingURL=PrismaOrderRepository.js.map