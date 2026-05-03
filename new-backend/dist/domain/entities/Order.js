"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = exports.OrderStatus = void 0;
const Money_1 = require("../value-objects/Money");
const OrderItem_1 = require("./OrderItem");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus[OrderStatus["PENDING"] = 0] = "PENDING";
    OrderStatus[OrderStatus["CONFIRMED"] = 1] = "CONFIRMED";
    OrderStatus[OrderStatus["SHIPPING"] = 2] = "SHIPPING";
    OrderStatus[OrderStatus["DELIVERED"] = 3] = "DELIVERED";
    OrderStatus[OrderStatus["CANCELLED"] = 4] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class Order {
    customerId;
    id;
    status = OrderStatus.PENDING;
    items = [];
    shippingFee = new Money_1.Money(0, "VND");
    discount = new Money_1.Money(0, "VND");
    constructor(customerId) {
        this.customerId = customerId;
        this.id = crypto.randomUUID();
    }
    static fromCart(customerId, cart, shipPolicy, discountPolicy) {
        const order = new Order(customerId);
        for (const ci of cart.getItems()) {
            order.items.push(OrderItem_1.OrderItem.fromCartItem(ci));
        }
        order.shippingFee = shipPolicy.calculate(order);
        order.discount = discountPolicy.calculate(order);
        order.assertTotalsInvariant();
        return order;
    }
    totalItems() {
        const currency = this.items.length === 0 ? "VND" : this.items[0].unitPrice.currency;
        let sum = 0;
        for (const i of this.items)
            sum += i.subTotal().amount;
        return new Money_1.Money(sum, currency);
    }
    totalAmount() {
        return this.totalItems().plus(this.shippingFee).minus(this.discount);
    }
    getStatus() {
        return this.status;
    }
    getItems() {
        return Object.freeze([...this.items]);
    }
    confirm(variantsRepo) {
        if (this.status !== OrderStatus.PENDING) {
            throw new Error("Chỉ có thể confirm đơn hàng ở trạng thái PENDING");
        }
        // Trừ tồn kho
        for (const item of this.items) {
            const v = variantsRepo.find(variant => variant.sku === item.sku);
            if (!v)
                throw new Error(`Không tìm thấy variant với SKU: ${item.sku}`);
            v.decreaseStock(item.quantity);
        }
        this.status = OrderStatus.CONFIRMED;
    }
    ship() {
        if (this.status !== OrderStatus.CONFIRMED) {
            throw new Error("Chỉ có thể ship đơn hàng đã được CONFIRMED");
        }
        this.status = OrderStatus.SHIPPING;
    }
    deliver() {
        if (this.status !== OrderStatus.SHIPPING) {
            throw new Error("Chỉ có thể deliver đơn hàng đang SHIPPING");
        }
        this.status = OrderStatus.DELIVERED;
    }
    cancel(cancelPolicy, variantsRepo) {
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
    addItem(item) {
        if (this.status >= OrderStatus.SHIPPING) {
            throw new Error("Đơn hàng đã khóa, không thể thêm item");
        }
        this.items.push(item);
        this.assertTotalsInvariant();
    }
    removeItem(sku) {
        if (this.status >= OrderStatus.SHIPPING) {
            throw new Error("Đơn hàng đã khóa, không thể xóa item");
        }
        this.items = this.items.filter(i => i.sku !== sku);
        this.assertTotalsInvariant();
    }
    assertTotalsInvariant() {
        const calc = this.totalItems().plus(this.shippingFee).minus(this.discount);
        if (calc.amount < 0) {
            throw new Error("Tổng tiền đơn hàng không được âm");
        }
    }
}
exports.Order = Order;
//# sourceMappingURL=Order.js.map