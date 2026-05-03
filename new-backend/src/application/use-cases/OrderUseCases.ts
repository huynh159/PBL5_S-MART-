import { Order, OrderStatus } from '../../domain/entities/Order';

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class OrderUseCases {
    constructor(
        private readonly orderRepo: OrderRepository,
        private readonly productRepo: ProductRepository
    ) {}

    public async placeOrder(customerId: string, cartId: string): Promise<Order> {
        // ... (Giữ nguyên demo logic) ...
        throw new Error("Chức năng đang được kết nối với DB");
    }

    public async confirmOrder(orderId: string): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) throw new Error("Không tìm thấy đơn hàng");

        // Load tất cả variants liên quan đến order này
        const variants = [];
        for (const item of order.getItems()) {
            const variant = await this.productRepo.findVariantBySku(item.sku);
            if (variant) variants.push(variant);
        }

        // Gọi State Machine của Domain để trừ kho
        order.confirm(variants);

        // Lưu cập nhật xuống DB (Transaction)
        await this.productRepo.saveVariants(variants);
        await this.orderRepo.save(order);
    }
}
