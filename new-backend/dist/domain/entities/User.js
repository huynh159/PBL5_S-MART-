"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["STAFF"] = "STAFF";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["LOCKED"] = "LOCKED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class User {
    email;
    passwordHash;
    fullName;
    role;
    id;
    status = UserStatus.ACTIVE;
    constructor(email, // Đã đổi sang Email VO
    passwordHash, fullName, role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role;
        this.id = crypto.randomUUID();
    }
    getId() {
        return this.id;
    }
    getStatus() {
        return this.status;
    }
    lock() {
        this.status = UserStatus.LOCKED;
    }
    unlock() {
        this.status = UserStatus.ACTIVE;
    }
    logout() {
        // set token revoked, publish event...
    }
    updateProfile(newName) {
        this.fullName = newName;
    }
    login(password, hasher) {
        return this.status === UserStatus.ACTIVE && hasher.matches(password, this.passwordHash);
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map