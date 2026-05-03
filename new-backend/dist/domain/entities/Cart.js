"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cart = exports.CartItem = void 0;
const Money_1 = require("../value-objects/Money");
class CartItem {
    variantId;
    sku;
    quantity;
    unitPriceSnapshot; // Chụp giá tại thời điểm add
    constructor(variant, quantity) {
        if (quantity <= 0) {
            throw new Error("Số lượng phải lớn hơn 0");
        }
        this.variantId = variant.id;
        this.sku = variant.sku;
        this.quantity = quantity;
        // Lấy giá mặc định (chưa có VIP discount) để lưu snapshot
        this.unitPriceSnapshot = variant.getFinalPrice({ isVip: false });
    }
    subTotal() {
        return new Money_1.Money(this.unitPriceSnapshot.amount * this.quantity, this.unitPriceSnapshot.currency);
    }
    getUnitPrice() {
        return this.unitPriceSnapshot;
    }
}
exports.CartItem = CartItem;
class Cart {
    customerId;
    items = [];
    constructor(customerId) {
        this.customerId = customerId;
    }
    getItems() {
        return Object.freeze([...this.items]);
    }
    addItem(variant, qty) {
        if (qty <= 0)
            throw new Error("Số lượng phải lớn hơn 0");
        if (variant.getQuantity() < qty) {
            throw new Error("Tồn kho không đủ để thêm vào giỏ hàng");
        }
        // Không trừ tồn kho ở đây, chỉ check
        this.items.push(new CartItem(variant, qty));
    }
    removeItem(sku) {
        const index = this.items.findIndex(i => i.sku === sku);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }
}
exports.Cart = Cart;
//# sourceMappingURL=Cart.js.map