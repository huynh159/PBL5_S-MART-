"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
class OrderController {
    orderUseCases;
    constructor(orderUseCases) {
        this.orderUseCases = orderUseCases;
    }
    async placeOrder(req, res) {
        try {
            // Lấy customerId từ JWT Token (được parse ở Middleware)
            const customerId = req.body.userId;
            const cartId = req.body.cartId;
            const order = await this.orderUseCases.placeOrder(customerId, cartId);
            res.status(201).json({ message: "Đặt hàng thành công", orderId: order.id });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async confirmOrder(req, res) {
        try {
            const orderId = req.params.orderId;
            await this.orderUseCases.confirmOrder(orderId);
            res.status(200).json({ message: "Đã xác nhận đơn hàng, kho đã được trừ!" });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=OrderController.js.map