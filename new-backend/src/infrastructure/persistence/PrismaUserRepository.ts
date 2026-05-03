import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/entities/User';
import { Customer } from '../../domain/entities/Customer';
import { Staff } from '../../domain/entities/Staff';
import { Email } from '../../domain/value-objects/Email';
import { Address } from '../../domain/value-objects/Address';
import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';
import { UserRole } from '../../domain/entities/User';
import { prisma } from './PrismaClient';

export class PrismaUserRepository implements UserRepository {
    
    public async findByEmail(email: Email): Promise<User | null> {
        const row = await prisma.user.findUnique({
            where: { email: email.value }
        });

        if (!row) return null;
        return this.mapToDomain(row);
    }

    public async findById(id: string): Promise<User | null> {
        const row = await prisma.user.findUnique({
            where: { id: parseInt(id) } // Tạm cast id sang int theo schema cũ
        });

        if (!row) return null;
        return this.mapToDomain(row);
    }

    public async save(user: User): Promise<void> {
        // Ánh xạ Domain User sang cấu trúc Prisma model
        // Ở đây để demo đơn giản, ta coi mọi user được lưu có role tương ứng
        let roleStr: any = "CUSTOMER";
        if (user instanceof Customer) roleStr = "CUSTOMER";
        else if (user instanceof Staff) roleStr = "STAFF";
        else if (user.role === UserRole.ADMIN) roleStr = "ADMIN";

        // Logic lưu user xuống Database bằng Prisma
        await prisma.user.create({
            data: {
                email: user.email.value,
                password: (user as any).passwordHash, // Mở bypass truy cập cho mục đích lưu
                role: roleStr,
            }
        });
    }

    private mapToDomain(row: any): User {
        const emailVO = new Email(row.email);
        if (row.role === 'STAFF' || row.role === 'ADMIN') {
            return new Staff(
                emailVO, row.password, row.fullName || 'Staff', 
                "CODE_" + row.id, "Position", "Dept"
            );
        }
        
        // Mặc định trả về Customer
        return new Customer(
            emailVO, 
            row.password, 
            row.fullName || 'Customer', 
            new Address("Line 1", "City", "Country", "Zip"), 
            new PhoneNumber("0900000000")
        );
    }
}
