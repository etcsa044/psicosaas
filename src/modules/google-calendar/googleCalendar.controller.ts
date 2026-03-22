import { Response, NextFunction, Request } from 'express';
import { IAuthRequest } from '@shared/types';
import { googleCalendarService } from './googleCalendar.service';
import User from '@modules/auth/models/user.model';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';

export const googleCalendarController = {
    /**
     * Redirect user to Google OAuth consent screen.
     * Accepts the access token as a query parameter since browser redirects cannot carry Bearer headers.
     */
    async auth(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.query.token as string;
            if (!token) {
                return res.status(400).json({ status: 'error', message: 'Token is required as query parameter' });
            }

            // Decode the JWT to extract userId
            const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
            const userId = decoded._id || decoded.sub;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Invalid token' });
            }

            const authUrl = googleCalendarService.getAuthUrl(userId);
            res.redirect(authUrl);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Handle the Google OAuth callback.
     * Exchanges code for tokens, saves them, and redirects back to frontend.
     */
    async callback(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const code = req.query.code as string;
            const userId = req.query.state as string;

            if (!code || !userId) {
                return res.status(400).json({ status: 'error', message: 'Missing code or state parameter' });
            }

            await googleCalendarService.handleCallback(code, userId);

            // Redirect back to frontend settings page with a success flag
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/settings?google=success`);
        } catch (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            res.redirect(`${frontendUrl}/settings?google=error`);
        }
    },

    /**
     * Get current Google Calendar integration status.
     */
    async status(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!._id;
            const user = await User.findById(userId).select('googleIntegration.connected googleIntegration.email googleIntegration.autoMeet');

            res.status(200).json({
                status: 'success',
                data: {
                    connected: user?.googleIntegration?.connected || false,
                    email: user?.googleIntegration?.email || null,
                    autoMeet: user?.googleIntegration?.autoMeet ?? true,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Disconnect Google Calendar integration.
     */
    async disconnect(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!._id;
            await googleCalendarService.disconnect(userId);

            res.status(200).json({ status: 'success', message: 'Google Calendar desconectado' });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update Google Calendar settings (e.g., autoMeet toggle).
     */
    async updateSettings(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!._id;
            const { autoMeet } = req.body;

            const update: any = {};
            if (typeof autoMeet === 'boolean') update['googleIntegration.autoMeet'] = autoMeet;

            await User.findByIdAndUpdate(userId, { $set: update });

            res.status(200).json({ status: 'success', message: 'Configuración actualizada' });
        } catch (error) {
            next(error);
        }
    },
};
