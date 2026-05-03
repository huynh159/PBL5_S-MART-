import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { prisma } from './PrismaClient';

export class PrismaOrderRepository implements OrderRepository {
    public async findById(id: string): Promise<Order | null> {
        const row = await prisma.order.findUnique({
            where: { id: parseInt(id) }
        });
        if (!row) return null;
        
        // Cần map dữ liệu row sang Entity Order. 
        // Trong dự án thực tế ta sẽ load cả OrderItem và dùng Reflection/Factory.
        // Đây là ví dụ trả về mock.
        return null;
    }

    public async save(order: Order): Promise<void> {
        let statusStr = "PENDING";
        switch (order.getStatus()) {
            case OrderStatus.CONFIRMED: statusStr = "CONFIRMED"; break;
            case OrderStatus.SHIPPING: statusStr = "SHIPPING"; break;
            case OrderStatus.DELIVERED: statusStr = "DELIVERED"; break;
            case OrderStatus.CANCELLED: statusStr = "CANCELLED"; break;
        }

        // Tạo order và lưu kèm OrderItems (sử dụng transaction của Prisma)
        // Lưu ý: customerId trong Entity lúc này là chuỗi, nhưng DB lưu Int, 
        // ở mức production cần có mapper chuyên biệt.
        const cId = parseInt(order.customerId) || 1;

        const prismaOrder = await prisma.order.create({
            data: {
                userId: cId,
                total: order.totalAmount,
                status: order.status as any,
                address: "N/A",
                phone: "N/A",
                orderItems: {
                    create: order.items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        price: i.unitPrice.amount
                    }))
                }
            }
        });
    }
}
