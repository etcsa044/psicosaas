import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';
import { IUser } from './models/user.model';

interface TokenPayload {
    _id: string;
    tenantId: string;
    email: string;
    roleId: string;
}

export class JwtService {
    generateAccessToken(user: IUser): string {
        const payload: TokenPayload = {
            _id: user._id.toString(),
            tenantId: user.tenantId,
            email: user.email,
            roleId: user.roleId.toString(),
        };

        const options: SignOptions = {
            expiresIn: config.jwt.accessExpiration as any,
        };

        return jwt.sign(payload, config.jwt.accessSecret, options);
    }

    generateRefreshToken(user: IUser): string {
        const options: SignOptions = {
            expiresIn: config.jwt.refreshExpiration as any,
        };

        return jwt.sign(
            { _id: user._id.toString(), tenantId: user.tenantId },
            config.jwt.refreshSecret,
            options
        );
    }

    verifyAccessToken(token: string): TokenPayload {
        return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    }

    verifyRefreshToken(token: string): { _id: string; tenantId: string } {
        return jwt.verify(token, config.jwt.refreshSecret) as { _id: string; tenantId: string };
    }

    getRefreshExpiration(): Date {
        const match = config.jwt.refreshExpiration.match(/^(\d+)([smhd])$/);
        if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };

        return new Date(Date.now() + value * (multipliers[unit] || multipliers.d));
    }
}

export const jwtService = new JwtService();
