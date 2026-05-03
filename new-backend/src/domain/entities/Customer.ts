import { User, UserRole } from './User';
import { Email } from '../value-objects/Email';
import { Address } from '../value-objects/Address';
import { PhoneNumber } from '../value-objects/PhoneNumber';
import { Cart } from './Cart';
import { Order, ShippingFeePolicy, DiscountPolicy, PaymentPolicy } from './Order';
import { ProductVariant } from './ProductVariant';
import { Product } from './Product';

export interface ProductVectorSearch {
    search(query: string): Product[];
}

export class Customer extends User {
    private address: Address;
    private phone: PhoneNumber;
    private accumulatedPoints: number = 0;
    private cart: Cart;
    private readonly orders: Order[] = [];

    constructor(
        email: Email, 
        passwordHash: string, 
        fullName: string, 
        address: Address, 
        phone: PhoneNumber
    ) {
        super(email, passwordHash, fullName, UserRole.CUSTOMER);
        this.address = address;
        this.phone = phone;
        this.cart = new Cart(this.getId());
    }

    public getAddress(): Address {
        return this.address;
    }

    public updateAddress(newAddress: Address): void {
        this.address = newAddress;
    }

    public getPhone(): PhoneNumber {
        return this.phone;
    }

    public updatePhone(newPhone: PhoneNumber): void {
        this.phone = newPhone;
    }

    public getOrders(): readonly Order[] {
        return Object.freeze([...this.orders]);
    }

    public addToCart(variant: ProductVariant, qty: number): void {
        this.cart.addItem(variant, qty);
    }

    public placeOrder(paymentPolicy: PaymentPolicy, shippingFeePolicy: ShippingFeePolicy, discountPolicy: DiscountPolicy): Order {
        const order = Order.fromCart(this.getId(), this.cart, shippingFeePolicy, discountPolicy);
        paymentPolicy.authorize(order);
        this.orders.push(order);
        this.cart = new Cart(this.getId());
        return order;
    }

    public searchAI(query: string, service: ProductVectorSearch): Product[] {
        return service.search(query);
    }
}
