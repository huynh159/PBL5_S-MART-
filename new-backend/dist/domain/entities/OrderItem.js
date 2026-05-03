"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const Money_1 = require("../value-objects/Money");
class OrderItem {
    sku;
    quantity;
    unitPrice;
    constructor(sku, quantity, unitPrice) {
        this.sku = sku;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }
    static fromCartItem(ci) {
        return new OrderItem(ci.sku, ci.quantity, ci.getUnitPrice());
    }
    subTotal() {
        return new Money_1.Money(this.unitPrice.amount * this.quantity, this.unitPrice.currency);
    }
}
exports.OrderItem = OrderItem;
//# sourceMappingURL=OrderItem.js.map