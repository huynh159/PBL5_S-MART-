import { Money } from '../value-objects/Money';

export interface CustomerContext {
    isVip: boolean;
}

export interface PriceStrategy {
    calculate(basePrice: Money, ctx: CustomerContext): Money;
}

export class NormalPrice implements PriceStrategy {
    public calculate(basePrice: Money, ctx: CustomerContext): Money {
        return basePrice;
    }
}

export class SalePrice implements PriceStrategy {
    constructor(private readonly percent: number) {
        if (percent < 0 || percent > 100) {
            throw new Error("Phần trăm giảm giá phải từ 0 đến 100");
        }
    }

    public calculate(basePrice: Money, ctx: CustomerContext): Money {
        const discountAmount = (basePrice.amount * this.percent) / 100;
        return new Money(basePrice.amount - discountAmount, basePrice.currency);
    }
}

export class MemberPrice implements PriceStrategy {
    constructor(private readonly vipPercent: number) {}

    public calculate(basePrice: Money, ctx: CustomerContext): Money {
        const pct = ctx.isVip ? this.vipPercent : 0;
        const discountAmount = (basePrice.amount * pct) / 100;
        return new Money(basePrice.amount - discountAmount, basePrice.currency);
    }
}
