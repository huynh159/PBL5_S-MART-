import { Money } from '../value-objects/Money';
import { PriceStrategy, NormalPrice, CustomerContext } from '../services/PriceStrategy';

export class ProductVariant {
    public readonly id: string;
    
    constructor(
        public readonly productId: string,
        public readonly sku: string,
        public readonly size: string,
        public readonly color: string,
        private basePrice: Money,
        private quantity: number, // stock
        private priceStrategy: PriceStrategy = new NormalPrice()
    ) {
        this.id = crypto.randomUUID();
        if (quantity < 0) {
            throw new Error("Số lượng (stock) không được nhỏ hơn 0");
        }
    }

    public getFinalPrice(ctx: CustomerContext): Money {
        return this.priceStrategy.calculate(this.basePrice, ctx);
    }

    public getBasePrice(): Money {
        return this.basePrice;
    }

    public setPriceStrategy(strategy: PriceStrategy): void {
        this.priceStrategy = strategy;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public decreaseStock(qty: number): void {
        if (qty <= 0) throw new Error("Số lượng giảm phải lớn hơn 0");
        if (this.quantity - qty < 0) {
            throw new Error("Tồn kho không đủ, không thể giảm xuống âm");
        }
        this.quantity -= qty;
    }

    public increaseStock(qty: number): void {
        if (qty <= 0) throw new Error("Số lượng tăng phải lớn hơn 0");
        this.quantity += qty;
    }
}
