import { Money } from '../value-objects/Money';
import { OrderItem } from './OrderItem';
import { Cart } from './Cart';
import { ProductVariant } from './ProductVariant';

export enum OrderStatus {
    PENDING = 0,
    CONFIRMED = 1,
    SHIPPING = 2,
    DELIVERED = 3,
    CANCELLED = 4
}

export interface ShippingFeePolicy {
    calculate(order: Order): Money;
}

export interface DiscountPolicy {
    calculate(order: Order): Money;
}

export interface CancelPolicy {
    canCancel(status: OrderStatus): boolean;
}

export interface PaymentPolicy {
    authorize(order: Order): void;
}

export class Order {
    public readonly id: string;
    private status: OrderStatus = OrderStatus.PENDING;
    private items: OrderItem[] = [];
    public shippingFee: Money = new Money(0, "VND");
    public discount: Money = new Money(0, "VND");

    private constructor(public readonly customerId: string) {
        this.id = crypto.randomUUID();
    }

    public static fromCart(
        customerId: string, 
        cart: Cart, 
        shipPolicy: ShippingFeePolicy, 
        discountPolicy: DiscountPolicy
    ): Order {
        const order = new Order(customerId);
        for (const ci of cart.getItems()) {
            order.items.push(OrderItem.fromCartItem(ci));
        }
        order.shippingFee = shipPolicy.calculate(order);
        order.discount = discountPolicy.calculate(order);
        order.assertTotalsInvariant();
        return order;
    }

    public totalItems(): Money {
        const currency = this.items.length === 0 ? "VND" : this.items[0].unitPrice.currency;
        let sum = 0;
        for (const i of this.items) sum += i.subTotal().amount;
        return new Money(sum, currency);
    }

    public totalAmount(): Money {
        return this.totalItems().plus(this.shippingFee).minus(this.discount);
    }

    public getStatus(): OrderStatus {
        return this.status;
    }

    public getItems(): readonly OrderItem[] {
        return Object.freeze([...this.items]);
    }

    public confirm(variantsRepo: ProductVariant[]): void {
        if (this.status !== OrderStatus.PENDING) {
            throw new Error("Chỉ có thể confirm đơn hàng ở trạng thái PENDING");
        }
        // Trừ tồn kho
        for (const item of this.items) {
            const v = variantsRepo.find(variant => variant.sku === item.sku);
            if (!v) throw new Error(`Không tìm thấy variant với SKU: ${item.sku}`);
            v.decreaseStock(item.quantity);
        }
        this.status = OrderStatus.CONFIRMED;
    }

    public ship(): void {
        if (this.status !== OrderStatus.CONFIRMED) {
            throw new Error("Chỉ có thể ship đơn hàng đã được CONFIRMED");
        }
        this.status = OrderStatus.SHIPPING;
    }

    public deliver(): void {
        if (this.status !== OrderStatus.SHIPPING) {
            throw new Error("Chỉ có thể deliver đơn hàng đang SHIPPING");
        }
        this.status = OrderStatus.DELIVERED;
    }

    public cancel(cancelPolicy: CancelPolicy, variantsRepo: ProductVariant[]): void {
        if (!cancelPolicy.canCancel(this.status)) {
            throw new Error("Không thể hủy đơn hàng lúc này");
        }
        // Hoàn tồn kho nếu hủy trước shipping
        if (this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED) {
            for (const item of this.items) {
                const v = variantsRepo.find(variant => variant.sku === item.sku);
                if (v) {
                    v.increaseStock(item.quantity);
                }
            }
        }
        this.status = OrderStatus.CANCELLED;
    }

    public addItem(item: OrderItem): void {
        if (this.status >= OrderStatus.SHIPPING) {
            throw new Error("Đơn hàng đã khóa, không thể thêm item");
        }
        this.items.push(item);
        this.assertTotalsInvariant();
    }

    public removeItem(sku: string): void {
        if (this.status >= OrderStatus.SHIPPING) {
            throw new Error("Đơn hàng đã khóa, không thể xóa item");
        }
        this.items = this.items.filter(i => i.sku !== sku);
        this.assertTotalsInvariant();
    }

    private assertTotalsInvariant(): void {
        const calc = this.totalItems().plus(this.shippingFee).minus(this.discount);
        if (calc.amount < 0) {
            throw new Error("Tổng tiền đơn hàng không được âm");
        }
    }
}
