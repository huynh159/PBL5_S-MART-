"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const User_1 = require("./User");
const Cart_1 = require("./Cart");
const Order_1 = require("./Order");
class Customer extends User_1.User {
    address;
    phone;
    accumulatedPoints = 0;
    cart;
    orders = [];
    constructor(email, passwordHash, fullName, address, phone) {
        super(email, passwordHash, fullName, User_1.UserRole.CUSTOMER);
        this.address = address;
        this.phone = phone;
        this.cart = new Cart_1.Cart(this.getId());
    }
    getAddress() {
        return this.address;
    }
    updateAddress(newAddress) {
        this.address = newAddress;
    }
    getPhone() {
        return this.phone;
    }
    updatePhone(newPhone) {
        this.phone = newPhone;
    }
    getOrders() {
        return Object.freeze([...this.orders]);
    }
    addToCart(variant, qty) {
        this.cart.addItem(variant, qty);
    }
    placeOrder(paymentPolicy, shippingFeePolicy, discountPolicy) {
        const order = Order_1.Order.fromCart(this.getId(), this.cart, shippingFeePolicy, discountPolicy);
        paymentPolicy.authorize(order);
        this.orders.push(order);
        this.cart = new Cart_1.Cart(this.getId());
        return order;
    }
    searchAI(query, service) {
        return service.search(query);
    }
}
exports.Customer = Customer;
//# sourceMappingURL=Customer.js.map