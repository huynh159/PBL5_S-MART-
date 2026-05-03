import { Request, Response } from 'express';
import { OrderUseCases } from '../../application/use-cases/OrderUseCases';

export class OrderController {
    constructor(private readonly orderUseCases: OrderUseCases) {}

    public async placeOrder(req: Request, res: Response): Promise<void> {
        try {
            // Lấy customerId từ JWT Token (được parse ở Middleware)
            const customerId = req.body.userId; 
            const cartId = req.body.cartId;
            const order = await this.orderUseCases.placeOrder(customerId, cartId);
            res.status(201).json({ message: "Đặt hàng thành công", orderId: order.id });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    public async confirmOrder(req: Request, res: Response): Promise<void> {
        try {
            const orderId = req.params.orderId as string;
            await this.orderUseCases.confirmOrder(orderId);
            res.status(200).json({ message: "Đã xác nhận đơn hàng, kho đã được trừ!" });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
