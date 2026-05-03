"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = void 0;
class PhoneNumber {
    value;
    constructor(value) {
        // Chấp nhận chuỗi số từ 9 đến 15 ký tự
        if (!value || !/^\d{9,15}$/.test(value)) {
            throw new Error("Số điện thoại không hợp lệ");
        }
        this.value = value;
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.PhoneNumber = PhoneNumber;
//# sourceMappingURL=PhoneNumber.js.map