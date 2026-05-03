"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderUseCases = void 0;
class OrderUseCases {
    orderRepo;
    productRepo;
    constructor(orderRepo, productRepo) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
    }
    async placeOrder(customerId, cartId) {
        // ... (Giữ nguyên demo logic) ...
        throw new Error("Chức năng đang được kết nối với DB");
    }
    async confirmOrder(orderId) {
        const order = await this.orderRepo.findById(orderId);
        if (!order)
            throw new Error("Không tìm thấy đơn hàng");
        // Load tất cả variants liên quan đến order này
        const variants = [];
        for (const item of order.getItems()) {
            const variant = await this.productRepo.findVariantBySku(item.sku);
            if (variant)
                variants.push(variant);
        }
        // Gọi State Machine của Domain để trừ kho
        order.confirm(variants);
        // Lưu cập nhật xuống DB (Transaction)
        await this.productRepo.saveVariants(variants);
        await this.orderRepo.save(order);
    }
}
exports.OrderUseCases = OrderUseCases;
//# sourceMappingURL=OrderUseCases.js.map