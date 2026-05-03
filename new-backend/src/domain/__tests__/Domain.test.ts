import { describe, it, expect } from 'vitest';
import { Cart } from '../entities/Cart';
import { ProductVariant } from '../entities/ProductVariant';
import { Money } from '../value-objects/Money';
import { Order, OrderStatus, ShippingFeePolicy, DiscountPolicy } from '../entities/Order';
import { Product } from '../entities/Product';
import { OrderItem } from '../entities/OrderItem';

describe('Domain Rules (Invariants)', () => {
    it('1. Thêm vào Cart vượt stock → ném lỗi', () => {
        const cart = new Cart('customer-123');
        const price = new Money(100000, 'VND');
        const variant = new ProductVariant('prod-1', 'SKU-01', 'M', 'Red', price, 5); // stock = 5

        // Thêm hợp lệ
        cart.addItem(variant, 3);
        expect(cart.getItems().length).toBe(1);

        // Thêm vượt stock
        expect(() => {
            cart.addItem(variant, 6);
        }).toThrowError('Tồn kho không đủ để thêm vào giỏ hàng');
    });

    it('2. Order.confirm() trừ đúng tồn kho', () => {
        const cart = new Cart('customer-123');
        const variant = new ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money(100, 'VND'), 10);
        cart.addItem(variant, 2);

        const dummyShipPolicy: ShippingFeePolicy = { calculate: () => new Money(0, 'VND') };
        const dummyDiscountPolicy: DiscountPolicy = { calculate: () => new Money(0, 'VND') };

        const order = Order.fromCart('customer-123', cart, dummyShipPolicy, dummyDiscountPolicy);
        
        expect(order.getStatus()).toBe(OrderStatus.PENDING);
        
        // Confirm order
        order.confirm([variant]);

        expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
        expect(variant.getQuantity()).toBe(8); // Tồn kho từ 10 -> 8
    });

    it('3. Order.ship() rồi sửa item → ném lỗi', () => {
        const cart = new Cart('customer-123');
        const variant = new ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money(100, 'VND'), 10);
        cart.addItem(variant, 2);

        const dummyShipPolicy: ShippingFeePolicy = { calculate: () => new Money(0, 'VND') };
        const dummyDiscountPolicy: DiscountPolicy = { calculate: () => new Money(0, 'VND') };

        const order = Order.fromCart('customer-123', cart, dummyShipPolicy, dummyDiscountPolicy);
        order.confirm([variant]);
        order.ship();

        expect(order.getStatus()).toBe(OrderStatus.SHIPPING);

        // Cố gắng thêm item
        const extraItem = new OrderItem('SKU-02', 1, new Money(50, 'VND'));
        expect(() => {
            order.addItem(extraItem);
        }).toThrowError('Đơn hàng đã khóa, không thể thêm item');

        // Cố gắng xóa item
        expect(() => {
            order.removeItem('SKU-01');
        }).toThrowError('Đơn hàng đã khóa, không thể xóa item');
    });

    it('4. Product.updateDescription() cập nhật vector', () => {
        const product = new Product('Test Product', 'Old Description', 'cat-1');
        const initialVector = product.getVectorData();

        product.updateDescription('New Description');
        const newVector = product.getVectorData();

        // Với mock sinh random trong hàm updateVectorInternal hiện tại, 
        // xác suất trùng vectorData gần như bằng không.
        expect(initialVector).not.toEqual(newVector);
    });

    it('5. Tính totalAmount đúng với ship/discount', () => {
        const cart = new Cart('customer-123');
        const variant = new ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money(100, 'VND'), 10);
        cart.addItem(variant, 2); // 200 VND
        
        const variant2 = new ProductVariant('prod-2', 'SKU-02', 'L', 'Blue', new Money(50, 'VND'), 5);
        cart.addItem(variant2, 1); // 50 VND
        // Tổng giỏ hàng = 250 VND

        const shipPolicy: ShippingFeePolicy = { calculate: () => new Money(30, 'VND') };
        const discountPolicy: DiscountPolicy = { calculate: () => new Money(20, 'VND') };

        const order = Order.fromCart('customer-123', cart, shipPolicy, discountPolicy);

        // totalItems = 250
        expect(order.totalItems().amount).toBe(250);

        // totalAmount = 250 + 30 (ship) - 20 (discount) = 260
        expect(order.totalAmount().amount).toBe(260);
    });
});
