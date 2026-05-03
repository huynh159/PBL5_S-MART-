import bcrypt from 'bcrypt';

export class BcryptHasher {
    private readonly saltRounds = 10;

    public async hash(plainText: string): Promise<string> {
        return bcrypt.hash(plainText, this.saltRounds);
    }

    public async compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash);
    }
}
