export class Money {
    constructor(
        public readonly amount: number,
        public readonly currency: string = "VND"
    ) {
        if (amount < 0) {
            throw new Error("Số tiền không được âm");
        }
    }

    public plus(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error("Không thể cộng hai loại tiền tệ khác nhau");
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    public minus(other: Money): Money {
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
