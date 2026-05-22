import jwt from 'jsonwebtoken';
import { getRequiredEnv } from '../config/env';

export class JwtService {
    private readonly secret = getRequiredEnv('JWT_SECRET', 'development-secret-key-sport-shop');
    private readonly expiresIn = '24h';

    public generateToken(userId: string, role: string): string {
        return jwt.sign({ userId, role }, this.secret, { expiresIn: this.expiresIn });
    }

    public verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.secret);
        } catch (error) {
            throw new Error("Token không hợp lệ hoặc đã hết hạn");
        }
    }
}
