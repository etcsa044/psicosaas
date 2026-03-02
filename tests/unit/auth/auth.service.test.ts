jest.mock('uuid', () => ({
    v4: () => 'mock-uuid-1234',
}));
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
jest.mock('@config/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@modules/auth/models/user.model');
jest.mock('@modules/auth/models/refreshToken.model');
jest.mock('@modules/rbac/rbac.service');

import bcrypt from 'bcryptjs';
import { AuthService } from '@modules/auth/auth.service';
import User from '@modules/auth/models/user.model';
import RefreshToken from '@modules/auth/models/refreshToken.model';
import { rbacService } from '@modules/rbac/rbac.service';
import { Types } from 'mongoose';

const authService = new AuthService();
const mockUserId = new Types.ObjectId();

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerInput = {
            email: 'new@test.com',
            password: 'SecurePass123!',
            profile: { firstName: 'Juan', lastName: 'Pérez' },
        };

        it('should register successfully', async () => {
            const mockUser = {
                _id: mockUserId,
                email: registerInput.email,
                profile: registerInput.profile,
                tenantId: 'some-uuid',
                roleId: new Types.ObjectId(),
            };

            (User.findOne as jest.Mock).mockReturnValue({
                setOptions: jest.fn().mockResolvedValue(null),
            });
            (rbacService.createSystemRolesForTenant as jest.Mock).mockResolvedValue({
                OWNER: { _id: new Types.ObjectId() },
            });
            (User.create as jest.Mock).mockResolvedValue(mockUser);
            (RefreshToken.create as jest.Mock).mockResolvedValue({});

            const result = await authService.register(registerInput, '127.0.0.1');
            expect(result.user.email).toBe(registerInput.email);
            expect(result.tokens).toHaveProperty('accessToken');
            expect(result.tokens).toHaveProperty('refreshToken');
            expect(result.tenantId).toBeDefined();
        });

        it('should throw ConflictError if email already exists', async () => {
            (User.findOne as jest.Mock).mockReturnValue({
                setOptions: jest.fn().mockResolvedValue({ _id: 'existing' }),
            });

            await expect(authService.register(registerInput, '127.0.0.1'))
                .rejects.toThrow('An account with this email already exists');
        });
    });

    describe('login', () => {
        const loginInput = { email: 'test@test.com', password: 'password123' };

        it('should login successfully with correct credentials', async () => {
            const hash = await bcrypt.hash('password123', 4);
            const mockUser = {
                _id: mockUserId,
                email: 'test@test.com',
                passwordHash: hash,
                isActive: true,
                tenantId: 'tenant-1',
                roleId: new Types.ObjectId(),
                profile: { firstName: 'Test' },
                lastLoginAt: null,
                save: jest.fn().mockResolvedValue(true),
            };

            (User.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    setOptions: jest.fn().mockResolvedValue(mockUser),
                }),
            });
            (RefreshToken.create as jest.Mock).mockResolvedValue({});

            const result = await authService.login(loginInput, '127.0.0.1');
            expect(result.user.email).toBe('test@test.com');
            expect(result.tokens.accessToken).toBeDefined();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw UnauthorizedError for non-existent user', async () => {
            (User.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    setOptions: jest.fn().mockResolvedValue(null),
                }),
            });

            await expect(authService.login(loginInput, '127.0.0.1'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw UnauthorizedError for inactive user', async () => {
            (User.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    setOptions: jest.fn().mockResolvedValue({
                        _id: mockUserId,
                        isActive: false,
                        passwordHash: 'hash',
                    }),
                }),
            });

            await expect(authService.login(loginInput, '127.0.0.1'))
                .rejects.toThrow('Account is deactivated');
        });

        it('should throw UnauthorizedError for wrong password', async () => {
            (User.findOne as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    setOptions: jest.fn().mockResolvedValue({
                        _id: mockUserId,
                        isActive: true,
                        passwordHash: await bcrypt.hash('differentPassword', 4),
                    }),
                }),
            });

            await expect(authService.login(loginInput, '127.0.0.1'))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('logout', () => {
        it('should revoke the refresh token', async () => {
            (RefreshToken.findOneAndUpdate as jest.Mock).mockResolvedValue({});

            await authService.logout('some-refresh-token');
            expect(RefreshToken.findOneAndUpdate).toHaveBeenCalledWith(
                { token: 'some-refresh-token', revokedAt: null },
                { revokedAt: expect.any(Date) }
            );
        });
    });
});
