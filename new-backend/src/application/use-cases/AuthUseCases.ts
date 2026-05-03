import { UserRepository } from '../../domain/repositories/UserRepository';
import { BcryptHasher } from '../../infrastructure/security/BcryptHasher';
import { JwtService } from '../../infrastructure/security/JwtService';
import { Email } from '../../domain/value-objects/Email';
import { Customer } from '../../domain/entities/Customer';
import { Address } from '../../domain/value-objects/Address';
import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';

export class AuthUseCases {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly hasher: BcryptHasher,
        private readonly jwtService: JwtService
    ) {}

    public async registerCustomer(dto: any): Promise<void> {
        const emailVO = new Email(dto.email);
        
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await this.userRepository.findByEmail(emailVO);
        if (existingUser) {
            throw new Error("Email đã được sử dụng");
        }

        const passwordHash = await this.hasher.hash(dto.password);
        const addressVO = new Address(dto.addressLine1, dto.city, dto.country, dto.zip || "00000");
        const phoneVO = new PhoneNumber(dto.phone);

        const newCustomer = new Customer(
            emailVO,
            passwordHash,
            dto.fullName,
            addressVO,
            phoneVO
        );

        await this.userRepository.save(newCustomer);
    }

    public async login(dto: any): Promise<{ token: string, user: any }> {
        const emailVO = new Email(dto.email);
        const user: any = await this.userRepository.findByEmail(emailVO);
        
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
