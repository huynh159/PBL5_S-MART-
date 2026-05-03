"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaUserRepository = void 0;
const Customer_1 = require("../../domain/entities/Customer");
const Staff_1 = require("../../domain/entities/Staff");
const Email_1 = require("../../domain/value-objects/Email");
const Address_1 = require("../../domain/value-objects/Address");
const PhoneNumber_1 = require("../../domain/value-objects/PhoneNumber");
const User_1 = require("../../domain/entities/User");
const PrismaClient_1 = require("./PrismaClient");
class PrismaUserRepository {
    async findByEmail(email) {
        const row = await PrismaClient_1.prisma.user.findUnique({
            where: { email: email.value }
        });
        if (!row)
            return null;
        return this.mapToDomain(row);
    }
    async findById(id) {
        const row = await PrismaClient_1.prisma.user.findUnique({
            where: { id: parseInt(id) } // Tạm cast id sang int theo schema cũ
        });
        if (!row)
            return null;
        return this.mapToDomain(row);
    }
    async save(user) {
        // Ánh xạ Domain User sang cấu trúc Prisma model
        // Ở đây để demo đơn giản, ta coi mọi user được lưu có role tương ứng
        let roleStr = "CUSTOMER";
        if (user instanceof Customer_1.Customer)
            roleStr = "CUSTOMER";
        else if (user instanceof Staff_1.Staff)
            roleStr = "STAFF";
        else if (user.role === User_1.UserRole.ADMIN)
            roleStr = "ADMIN";
        // Logic lưu user xuống Database bằng Prisma
        await PrismaClient_1.prisma.user.create({
            data: {
                email: user.email.value,
                password: user.passwordHash, // Mở bypass truy cập cho mục đích lưu
                role: roleStr,
            }
        });
    }
    mapToDomain(row) {
        const emailVO = new Email_1.Email(row.email);
        if (row.role === 'STAFF' || row.role === 'ADMIN') {
            return new Staff_1.Staff(emailVO, row.password, row.fullName || 'Staff', "CODE_" + row.id, "Position", "Dept");
        }
        // Mặc định trả về Customer
        return new Customer_1.Customer(emailVO, row.password, row.fullName || 'Customer', new Address_1.Address("Line 1", "City", "Country", "Zip"), new PhoneNumber_1.PhoneNumber("0900000000"));
    }
}
exports.PrismaUserRepository = PrismaUserRepository;
//# sourceMappingURL=PrismaUserRepository.js.map