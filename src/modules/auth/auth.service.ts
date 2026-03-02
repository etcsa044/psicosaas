import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User, { IUser } from './models/user.model';
import RefreshToken from './models/refreshToken.model';
import { jwtService } from './jwt.service';
import { rbacService } from '@modules/rbac/rbac.service';
import { RegisterInput, LoginInput } from './auth.validation';
import {
    UnauthorizedError,
    ConflictError,
    NotFoundError,
} from '@shared/errors/AppError';
import { logger } from '@config/logger';

const SALT_ROUNDS = 12;

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface RegisterResult {
    user: Partial<IUser>;
    tokens: AuthTokens;
    tenantId: string;
}

export class AuthService {
    /**
     * Register a new psychologist — creates Tenant, User (OWNER), Branding, and RBAC roles.
     */
    async register(input: RegisterInput, ip: string): Promise<RegisterResult> {
        // Check if email already exists globally (for initial registration)
        const existingUser = await User.findOne({ email: input.email }).setOptions({
            _skipTenantCheck: true,
        } as any);
        if (existingUser) {
            throw new ConflictError('An account with this email already exists');
        }

        // Generate tenant ID
        const tenantId = uuidv4();

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

        // Create system roles for this tenant
        const roles = await rbacService.createSystemRolesForTenant(tenantId);
        const ownerRole = roles.OWNER as any;

        // Create user
        const user = await User.create({
            tenantId,
            email: input.email,
            passwordHash,
            roleId: ownerRole._id,
            profile: input.profile,
            isActive: true,
        });

        // Generate tokens
        const tokens = await this.generateTokenPair(user, ip);

        logger.info('New tenant registered', {
            tenantId,
            userId: user._id,
            email: user.email,
        });

        return {
            user: {
                _id: user._id,
                email: user.email,
                profile: user.profile,
                tenantId: user.tenantId,
            },
            tokens,
            tenantId,
        };
    }

    /**
     * Login with email and password
     */
    async login(input: LoginInput, ip: string): Promise<{ user: Partial<IUser>; tokens: AuthTokens }> {
        // Find user with password (normally excluded by `select: false`)
        const user = await User.findOne({ email: input.email })
            .select('+passwordHash')
            .setOptions({ _skipTenantCheck: true } as any);

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('Account is deactivated');
        }

        // Compare password
        const isMatch = await bcrypt.compare(input.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate tokens
        const tokens = await this.generateTokenPair(user, ip);

        logger.info('User logged in', {
            tenantId: user.tenantId,
            userId: user._id,
        });

        return {
            user: {
                _id: user._id,
                email: user.email,
                profile: user.profile,
                tenantId: user.tenantId,
                roleId: user.roleId,
            },
            tokens,
        };
    }

    /**
     * Refresh access token using a valid refresh token.
     * Implements token rotation — old token is revoked and replaced.
     */
    async refreshAccessToken(refreshTokenStr: string, ip: string): Promise<AuthTokens> {
        // Verify JWT
        let decoded: { _id: string; tenantId: string };
        try {
            decoded = jwtService.verifyRefreshToken(refreshTokenStr);
        } catch {
            throw new UnauthorizedError('Invalid refresh token');
        }

        // Find token in DB
        const storedToken = await RefreshToken.findOne({
            token: refreshTokenStr,
            revokedAt: null,
        });

        if (!storedToken) {
            // Token reuse detected — revoke all tokens for this user (security)
            await RefreshToken.updateMany(
                { userId: decoded._id },
                { revokedAt: new Date() }
            );
            logger.warn('Refresh token reuse detected — all tokens revoked', {
                userId: decoded._id,
                tenantId: decoded.tenantId,
            });
            throw new UnauthorizedError('Token reuse detected. Please login again.');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired');
        }

        // Get user
        const user = await User.findById(decoded._id).setOptions({
            _skipTenantCheck: true,
        } as any);
        if (!user || !user.isActive) {
            throw new UnauthorizedError('User not found or deactivated');
        }

        // Rotate: revoke old, create new
        const newTokens = await this.generateTokenPair(user, ip);

        storedToken.revokedAt = new Date();
        storedToken.replacedBy = newTokens.refreshToken;
        await storedToken.save();

        return newTokens;
    }

    /**
     * Logout — revoke the refresh token
     */
    async logout(refreshTokenStr: string): Promise<void> {
        await RefreshToken.findOneAndUpdate(
            { token: refreshTokenStr, revokedAt: null },
            { revokedAt: new Date() }
        );
    }

    private async generateTokenPair(user: IUser, ip: string): Promise<AuthTokens> {
        const accessToken = jwtService.generateAccessToken(user);
        const refreshToken = jwtService.generateRefreshToken(user);

        // Store refresh token in DB
        await RefreshToken.create({
            tenantId: user.tenantId,
            userId: user._id,
            token: refreshToken,
            expiresAt: jwtService.getRefreshExpiration(),
            createdByIp: ip,
        });

        return { accessToken, refreshToken };
    }
}

export const authService = new AuthService();
