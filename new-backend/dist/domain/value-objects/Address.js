"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
class Address {
    line1;
    city;
    country;
    zip;
    constructor(line1, city, country, zip) {
        this.line1 = line1;
        this.city = city;
        this.country = country;
        this.zip = zip;
        if (!line1 || !city || !country) {
            throw new Error("Địa chỉ không được để trống các trường bắt buộc");
        }
    }
    getFullAddress() {
        return `${this.line1}, ${this.city}, ${this.country} ${this.zip}`.trim();
    }
}
exports.Address = Address;
//# sourceMappingURL=Address.js.map