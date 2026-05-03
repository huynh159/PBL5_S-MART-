"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff = void 0;
const User_1 = require("./User");
class Staff extends User_1.User {
    staffCode;
    position;
    department;
    constructor(email, passwordHash, fullName, staffCode, position, department) {
        super(email, passwordHash, fullName, User_1.UserRole.STAFF);
        this.staffCode = staffCode;
        this.position = position;
        this.department = department;
    }
    getStaffCode() {
        return this.staffCode;
    }
    updatePosition(newPosition, newDepartment) {
        this.position = newPosition;
        this.department = newDepartment;
    }
    manageInventory(variant, delta) {
        if (delta >= 0) {
            variant.increaseStock(delta);
        }
        else {
            variant.decreaseStock(Math.abs(delta));
        }
    }
    processOrder(order, variantsRepo) {
        order.confirm(variantsRepo); // or move next state
    }
    updateProduct(product, desc) {
        product.updateDescription(desc);
    }
}
exports.Staff = Staff;
//# sourceMappingURL=Staff.js.map