"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberPrice = exports.SalePrice = exports.NormalPrice = void 0;
const Money_1 = require("../value-objects/Money");
class NormalPrice {
    calculate(basePrice, ctx) {
        return basePrice;
    }
}
exports.NormalPrice = NormalPrice;
class SalePrice {
    percent;
    constructor(percent) {
        this.percent = percent;
        if (percent < 0 || percent > 100) {
            throw new Error("Phần trăm giảm giá phải từ 0 đến 100");
        }
    }
    calculate(basePrice, ctx) {
        const discountAmount = (basePrice.amount * this.percent) / 100;
        return new Money_1.Money(basePrice.amount - discountAmount, basePrice.currency);
    }
}
exports.SalePrice = SalePrice;
class MemberPrice {
    vipPercent;
    constructor(vipPercent) {
        this.vipPercent = vipPercent;
    }
    calculate(basePrice, ctx) {
        const pct = ctx.isVip ? this.vipPercent : 0;
        const discountAmount = (basePrice.amount * pct) / 100;
        return new Money_1.Money(basePrice.amount - discountAmount, basePrice.currency);
    }
}
exports.MemberPrice = MemberPrice;
//# sourceMappingURL=PriceStrategy.js.map