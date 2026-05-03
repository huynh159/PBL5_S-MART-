export class Address {
    constructor(
        public readonly line1: string,
        public readonly city: string,
        public readonly country: string,
        public readonly zip: string
    ) {
        if (!line1 || !city || !country) {
            throw new Error("Địa chỉ không được để trống các trường bắt buộc");
        }
    }

    public getFullAddress(): string {
        return `${this.line1}, ${this.city}, ${this.country} ${this.zip}`.trim();
    }
}
