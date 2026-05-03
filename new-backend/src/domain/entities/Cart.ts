import { Money } from '../value-objects/Money';
import { ProductVariant } from './ProductVariant';

export class CartItem {
    public readonly variantId: string;
    public readonly sku: string;
    public readonly quantity: number;
    private readonly unitPriceSnapshot: Money; // Chụp giá tại thời điểm add

    constructor(variant: ProductVariant, quantity: number) {
        if (quantity <= 0) {
            throw new Error("Số lượng phải lớn hơn 0");
        }
        this.variantId = variant.id;
        this.sku = variant.sku;
        this.quantity = quantity;
        // Lấy giá mặc định (chưa có VIP discount) để lưu snapshot
        this.unitPriceSnapshot = variant.getFinalPrice({ isVip: false });
    }

    public subTotal(): Money {
        return new Money(
            this.unitPriceSnapshot.amount * this.quantity,
            this.unitPriceSnapshot.currency
        );
    }

    public getUnitPrice(): Money {
        return this.unitPriceSnapshot;
    }
}

export class Cart {
    private readonly items: CartItem[] = [];

    constructor(public readonly customerId: string) {}

    public getItems(): readonly CartItem[] {
        return Object.freeze([...this.items]);
    }

    public addItem(variant: ProductVariant, qty: number): void {
        if (qty <= 0) throw new Error("Số lượng phải lớn hơn 0");
        if (variant.getQuantity() < qty) {
            throw new Error("Tồn kho không đủ để thêm vào giỏ hàng");
        }
        // Không trừ tồn kho ở đây, chỉ check
        this.items.push(new CartItem(variant, qty));
    }

    public removeItem(sku: string): void {
        const index = this.items.findIndex(i => i.sku === sku);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }
}
