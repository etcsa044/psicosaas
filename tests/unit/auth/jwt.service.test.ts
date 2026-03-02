import jwt from 'jsonwebtoken';

// Mock config before importing jwt.service
jest.mock('@config/index', () => ({
    config: {
        jwt: {
            accessSecret: 'test-access-secret',
            refreshSecret: 'test-refresh-secret',
            accessExpiration: '15m',
            refreshExpiration: '7d',
        },
    },
}));

import { JwtService } from '@modules/auth/jwt.service';

const jwtService = new JwtService();

const mockUser = {
    _id: { toString: () => '507f1f77bcf86cd799439011' },
    tenantId: 'tenant-123',
    email: 'test@test.com',
    roleId: { toString: () => '507f1f77bcf86cd799439022' },
} as any;

describe('JwtService', () => {
    describe('generateAccessToken', () => {
        it('should generate a valid JWT access token', () => {
            const token = jwtService.generateAccessToken(mockUser);
            expect(typeof token).toBe('string');

            const decoded = jwt.verify(token, 'test-access-secret') as any;
            expect(decoded._id).toBe('507f1f77bcf86cd799439011');
            expect(decoded.tenantId).toBe('tenant-123');
            expect(decoded.email).toBe('test@test.com');
            expect(decoded.roleId).toBe('507f1f77bcf86cd799439022');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid JWT refresh token', () => {
            const token = jwtService.generateRefreshToken(mockUser);
            expect(typeof token).toBe('string');

            const decoded = jwt.verify(token, 'test-refresh-secret') as any;
            expect(decoded._id).toBe('507f1f77bcf86cd799439011');
            expect(decoded.tenantId).toBe('tenant-123');
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify a valid access token', () => {
            const token = jwtService.generateAccessToken(mockUser);
            const decoded = jwtService.verifyAccessToken(token);
            expect(decoded._id).toBe('507f1f77bcf86cd799439011');
            expect(decoded.tenantId).toBe('tenant-123');
        });

        it('should throw on invalid token', () => {
            expect(() => jwtService.verifyAccessToken('invalid-token')).toThrow();
        });

        it('should throw on expired token', () => {
            const token = jwt.sign(
                { _id: '123', tenantId: 't1', email: 'a@b.com', roleId: 'r1' },
                'test-access-secret',
                { expiresIn: '0s' }
            );
            expect(() => jwtService.verifyAccessToken(token)).toThrow();
        });
    });

    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', () => {
            const token = jwtService.generateRefreshToken(mockUser);
            const decoded = jwtService.verifyRefreshToken(token);
            expect(decoded._id).toBe('507f1f77bcf86cd799439011');
            expect(decoded.tenantId).toBe('tenant-123');
        });

        it('should throw on token signed with wrong secret', () => {
            const token = jwt.sign({ _id: '123' }, 'wrong-secret');
            expect(() => jwtService.verifyRefreshToken(token)).toThrow();
        });
    });

    describe('getRefreshExpiration', () => {
        it('should return a future date for 7d', () => {
            const expiration = jwtService.getRefreshExpiration();
            const now = new Date();
            expect(expiration.getTime()).toBeGreaterThan(now.getTime());
            // Should be roughly 7 days from now (within 1 minute tolerance)
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            expect(expiration.getTime() - now.getTime()).toBeCloseTo(sevenDays, -4);
        });
    });
});
