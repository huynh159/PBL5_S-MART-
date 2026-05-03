"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptHasher = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
class BcryptHasher {
    saltRounds = 10;
    async hash(plainText) {
        return bcrypt_1.default.hash(plainText, this.saltRounds);
    }
    async compare(plainText, hash) {
        return bcrypt_1.default.compare(plainText, hash);
    }
}
exports.BcryptHasher = BcryptHasher;
//# sourceMappingURL=BcryptHasher.js.map