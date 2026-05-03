import { Money } from '../value-objects/Money';
import { CartItem } from './Cart';

export class OrderItem {
    constructor(
        public readonly sku: string,
        public readonly quantity: number,
        public readonly unitPrice: Money
    ) {}

    public static fromCartItem(ci: CartItem): OrderItem {
        return new OrderItem(ci.sku, ci.quantity, ci.getUnitPrice());
    }

    public subTotal(): Money {
        return new Money(this.unitPrice.amount * this.quantity, this.unitPrice.currency);
    }
}
