import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '@shared/utils/apiResponse';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const result = await authService.register(req.body, ip);
            sendCreated(res, result);
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const result = await authService.login(req.body, ip);
            sendSuccess(res, result);
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const tokens = await authService.refreshAccessToken(req.body.refreshToken, ip);
            sendSuccess(res, tokens);
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logout(req.body.refreshToken);
            sendSuccess(res, { message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
