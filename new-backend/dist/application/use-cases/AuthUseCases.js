"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUseCases = void 0;
const Email_1 = require("../../domain/value-objects/Email");
const Customer_1 = require("../../domain/entities/Customer");
const Address_1 = require("../../domain/value-objects/Address");
const PhoneNumber_1 = require("../../domain/value-objects/PhoneNumber");
class AuthUseCases {
    userRepository;
    hasher;
    jwtService;
    constructor(userRepository, hasher, jwtService) {
        this.userRepository = userRepository;
        this.hasher = hasher;
        this.jwtService = jwtService;
    }
    async registerCustomer(dto) {
        const emailVO = new Email_1.Email(dto.email);
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await this.userRepository.findByEmail(emailVO);
        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }
        const passwordHash = await this.hasher.hash(dto.password);
        const addressVO = new Address_1.Address(dto.addressLine1, dto.city, dto.country, dto.zip || "00000");
        const phoneVO = new PhoneNumber_1.PhoneNumber(dto.phone);
        const newCustomer = new Customer_1.Customer(emailVO, passwordHash, dto.fullName, addressVO, phoneVO);
        await this.userRepository.save(newCustomer);
    }
    async login(dto) {
        const emailVO = new Email_1.Email(dto.email);
        const user = await this.userRepository.findByEmail(emailVO);
        if (!user) {
            throw new Error("Email hoặc mật khẩu không chính xác");
        }
        const isMatch = await this.hasher.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new Error("Email hoặc mật khẩu không chính xác");
        }
        const token = this.jwtService.generateToken(user.id, user.role);
        return {
            token,
            user: {
                id: user.id,
                email: user.email.value,
                fullName: user.fullName,
                role: user.role
            }
        };
    }
}
exports.AuthUseCases = AuthUseCases;
//# sourceMappingURL=AuthUseCases.js.map