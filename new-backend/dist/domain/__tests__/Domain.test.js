"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Cart_1 = require("../entities/Cart");
const ProductVariant_1 = require("../entities/ProductVariant");
const Money_1 = require("../value-objects/Money");
const Order_1 = require("../entities/Order");
const Product_1 = require("../entities/Product");
const OrderItem_1 = require("../entities/OrderItem");
(0, vitest_1.describe)('Domain Rules (Invariants)', () => {
    (0, vitest_1.it)('1. Thêm vào Cart vượt stock → ném lỗi', () => {
        const cart = new Cart_1.Cart('customer-123');
        const price = new Money_1.Money(100000, 'VND');
        const variant = new ProductVariant_1.ProductVariant('prod-1', 'SKU-01', 'M', 'Red', price, 5); // stock = 5
        // Thêm hợp lệ
        cart.addItem(variant, 3);
        (0, vitest_1.expect)(cart.getItems().length).toBe(1);
        // Thêm vượt stock
        (0, vitest_1.expect)(() => {
            cart.addItem(variant, 6);
        }).toThrowError('Tồn kho không đủ để thêm vào giỏ hàng');
    });
    (0, vitest_1.it)('2. Order.confirm() trừ đúng tồn kho', () => {
        const cart = new Cart_1.Cart('customer-123');
        const variant = new ProductVariant_1.ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money_1.Money(100, 'VND'), 10);
        cart.addItem(variant, 2);
        const dummyShipPolicy = { calculate: () => new Money_1.Money(0, 'VND') };
        const dummyDiscountPolicy = { calculate: () => new Money_1.Money(0, 'VND') };
        const order = Order_1.Order.fromCart('customer-123', cart, dummyShipPolicy, dummyDiscountPolicy);
        (0, vitest_1.expect)(order.getStatus()).toBe(Order_1.OrderStatus.PENDING);
        // Confirm order
        order.confirm([variant]);
        (0, vitest_1.expect)(order.getStatus()).toBe(Order_1.OrderStatus.CONFIRMED);
        (0, vitest_1.expect)(variant.getQuantity()).toBe(8); // Tồn kho từ 10 -> 8
    });
    (0, vitest_1.it)('3. Order.ship() rồi sửa item → ném lỗi', () => {
        const cart = new Cart_1.Cart('customer-123');
        const variant = new ProductVariant_1.ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money_1.Money(100, 'VND'), 10);
        cart.addItem(variant, 2);
        const dummyShipPolicy = { calculate: () => new Money_1.Money(0, 'VND') };
        const dummyDiscountPolicy = { calculate: () => new Money_1.Money(0, 'VND') };
        const order = Order_1.Order.fromCart('customer-123', cart, dummyShipPolicy, dummyDiscountPolicy);
        order.confirm([variant]);
        order.ship();
        (0, vitest_1.expect)(order.getStatus()).toBe(Order_1.OrderStatus.SHIPPING);
        // Cố gắng thêm item
        const extraItem = new OrderItem_1.OrderItem('SKU-02', 1, new Money_1.Money(50, 'VND'));
        (0, vitest_1.expect)(() => {
            order.addItem(extraItem);
        }).toThrowError('Đơn hàng đã khóa, không thể thêm item');
        // Cố gắng xóa item
        (0, vitest_1.expect)(() => {
            order.removeItem('SKU-01');
        }).toThrowError('Đơn hàng đã khóa, không thể xóa item');
    });
    (0, vitest_1.it)('4. Product.updateDescription() cập nhật vector', () => {
        const product = new Product_1.Product('Test Product', 'Old Description', 'cat-1');
        const initialVector = product.getVectorData();
        product.updateDescription('New Description');
        const newVector = product.getVectorData();
        // Với mock sinh random trong hàm updateVectorInternal hiện tại, 
        // xác suất trùng vectorData gần như bằng không.
        (0, vitest_1.expect)(initialVector).not.toEqual(newVector);
    });
    (0, vitest_1.it)('5. Tính totalAmount đúng với ship/discount', () => {
        const cart = new Cart_1.Cart('customer-123');
        const variant = new ProductVariant_1.ProductVariant('prod-1', 'SKU-01', 'M', 'Red', new Money_1.Money(100, 'VND'), 10);
        cart.addItem(variant, 2); // 200 VND
        const variant2 = new ProductVariant_1.ProductVariant('prod-2', 'SKU-02', 'L', 'Blue', new Money_1.Money(50, 'VND'), 5);
        cart.addItem(variant2, 1); // 50 VND
        // Tổng giỏ hàng = 250 VND
        const shipPolicy = { calculate: () => new Money_1.Money(30, 'VND') };
        const discountPolicy = { calculate: () => new Money_1.Money(20, 'VND') };
        const order = Order_1.Order.fromCart('customer-123', cart, shipPolicy, discountPolicy);
        // totalItems = 250
        (0, vitest_1.expect)(order.totalItems().amount).toBe(250);
        // totalAmount = 250 + 30 (ship) - 20 (discount) = 260
        (0, vitest_1.expect)(order.totalAmount().amount).toBe(260);
    });
});
//# sourceMappingURL=Domain.test.js.map