"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariant = void 0;
const PriceStrategy_1 = require("../services/PriceStrategy");
class ProductVariant {
    productId;
    sku;
    size;
    color;
    basePrice;
    quantity;
    priceStrategy;
    id;
    constructor(productId, sku, size, color, basePrice, quantity, // stock
    priceStrategy = new PriceStrategy_1.NormalPrice()) {
        this.productId = productId;
        this.sku = sku;
        this.size = size;
        this.color = color;
        this.basePrice = basePrice;
        this.quantity = quantity;
        this.priceStrategy = priceStrategy;
        this.id = crypto.randomUUID();
        if (quantity < 0) {
            throw new Error("Số lượng (stock) không được nhỏ hơn 0");
        }
    }
    getFinalPrice(ctx) {
        return this.priceStrategy.calculate(this.basePrice, ctx);
    }
    getBasePrice() {
        return this.basePrice;
    }
    setPriceStrategy(strategy) {
        this.priceStrategy = strategy;
    }
    getQuantity() {
        return this.quantity;
    }
    decreaseStock(qty) {
        if (qty <= 0)
            throw new Error("Số lượng giảm phải lớn hơn 0");
        if (this.quantity - qty < 0) {
            throw new Error("Tồn kho không đủ, không thể giảm xuống âm");
        }
        this.quantity -= qty;
    }
    increaseStock(qty) {
        if (qty <= 0)
            throw new Error("Số lượng tăng phải lớn hơn 0");
        this.quantity += qty;
    }
}
exports.ProductVariant = ProductVariant;
//# sourceMappingURL=ProductVariant.js.map