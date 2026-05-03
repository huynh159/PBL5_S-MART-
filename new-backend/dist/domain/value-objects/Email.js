"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
class Email {
    value;
    constructor(value) {
        if (!value || !/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
            throw new Error("Email không hợp lệ");
        }
        this.value = value;
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.Email = Email;
//# sourceMappingURL=Email.js.map