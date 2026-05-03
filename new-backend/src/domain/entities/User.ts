import { Email } from '../value-objects/Email';

export interface PasswordHasher {
    matches(password: string, hash: string): boolean;
}

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    STAFF = 'STAFF',
    ADMIN = 'ADMIN'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED'
}

export abstract class User {
    protected readonly id: string;
    protected status: UserStatus = UserStatus.ACTIVE;

    constructor(
        public readonly email: Email, // Đã đổi sang Email VO
        protected passwordHash: string,
        public fullName: string,
        public readonly role: UserRole
    ) {
        this.id = crypto.randomUUID();
    }

    public getId(): string {
        return this.id;
    }

    public getStatus(): UserStatus {
        return this.status;
    }

    public lock(): void {
        this.status = UserStatus.LOCKED;
    }

    public unlock(): void {
        this.status = UserStatus.ACTIVE;
    }

    public logout(): void {
        // set token revoked, publish event...
    }

    public updateProfile(newName: string): void {
        this.fullName = newName;
    }

    public login(password: string, hasher: PasswordHasher): boolean {
        return this.status === UserStatus.ACTIVE && hasher.matches(password, this.passwordHash);
    }
}
