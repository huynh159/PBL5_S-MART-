"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
class Money {
    amount;
    currency;
    constructor(amount, currency = "VND") {
        this.amount = amount;
        this.currency = currency;
        if (amount < 0) {
            throw new Error("Số tiền không được âm");
        }
    }
    plus(other) {
        if (this.currency !== other.currency) {
            throw new Error("Không thể cộng hai loại tiền tệ khác nhau");
        }
        return new Money(this.amount + other.amount, this.currency);
    }
    minus(other) {
        if (this.currency !== other.currency) {
            throw new Error("Không thể trừ hai loại tiền tệ khác nhau");
        }
        const newAmount = this.amount - other.amount;
        if (newAmount < 0) {
            throw new Error("Số dư không đủ");
        }
        return new Money(newAmount, this.currency);
    }
}
exports.Money = Money;
//# sourceMappingURL=Money.js.map