import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import User, { IUser } from '@modules/auth/models/user.model';
import Appointment from '@modules/appointment/models/appointment.model';
import { logger } from '@config/logger';
import { Types } from 'mongoose';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

export const googleCalendarService = {
    /**
     * Generate the Google OAuth consent URL for a professional.
     * We store the userId and tenantId in the `state` param (base64) so we know who to associate on callback.
     */
    getAuthUrl(userId: string, tenantId: string): string {
        const oauth2Client = getOAuth2Client();
        const statePayload = Buffer.from(JSON.stringify({ userId, tenantId })).toString('base64');
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
            state: statePayload,
        });
    },

    /**
     * Exchange the authorization code for tokens and persist them on the User document.
     */
    async handleCallback(code: string, userId: string, tenantId: string): Promise<void> {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // Get the user's Google email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        await User.findOneAndUpdate(
            { _id: userId, tenantId },
            {
                $set: {
                    'googleIntegration.connected': true,
                    'googleIntegration.email': userInfo.email,
                    'googleIntegration.refreshToken': tokens.refresh_token,
                    'googleIntegration.accessToken': tokens.access_token,
                    'googleIntegration.tokenExpiry': tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                },
            }
        );

        logger.info(`Google Calendar connected for user ${userId} (${userInfo.email})`);
    },

    /**
     * Build an authenticated OAuth2 client from a user's stored tokens.
     */
    async getAuthenticatedClient(userId: string | Types.ObjectId): Promise<OAuth2Client | null> {
        const user = await User.findById(userId)
            .select('+googleIntegration.refreshToken +googleIntegration.accessToken')
            .setOptions({ _skipTenantCheck: true } as any);
        if (!user?.googleIntegration?.connected || !user.googleIntegration.refreshToken) {
            return null;
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
            refresh_token: user.googleIntegration.refreshToken,
            access_token: user.googleIntegration.accessToken || undefined,
            expiry_date: user.googleIntegration.tokenExpiry?.getTime(),
        });

        // Listen for token refresh events so we persist updated access tokens
        oauth2Client.on('tokens', async (newTokens) => {
            const update: any = {};
            if (newTokens.access_token) update['googleIntegration.accessToken'] = newTokens.access_token;
            if (newTokens.expiry_date) update['googleIntegration.tokenExpiry'] = new Date(newTokens.expiry_date);
            if (newTokens.refresh_token) update['googleIntegration.refreshToken'] = newTokens.refresh_token;
            await User.findByIdAndUpdate(userId, { $set: update }).setOptions({ _skipTenantCheck: true } as any);
        });

        return oauth2Client;
    },

    /**
     * Create a Google Calendar event for an appointment.
     * Returns the Google Event ID for future updates/deletions.
     */
    async createEvent(
        professionalId: string | Types.ObjectId,
        appointment: any,
        patientEmail?: string,
        autoMeet?: boolean
    ): Promise<string | null> {
        const auth = await this.getAuthenticatedClient(professionalId);
        if (!auth) return null;

        const calendar = google.calendar({ version: 'v3', auth });

        const user = await User.findById(professionalId).setOptions({ _skipTenantCheck: true } as any);
        const calendarId = user?.googleIntegration?.calendarId || 'primary';
        const shouldCreateMeet = autoMeet ?? user?.googleIntegration?.autoMeet ?? true;

        const event: calendar_v3.Schema$Event = {
            summary: `Turno: ${appointment.patientName || 'Paciente'}`,
            description: `Tipo: ${appointment.type || 'Sesión'}\nModalidad: ${appointment.modality === 'video_call' ? 'Videollamada' : 'Presencial'}`,
            start: {
                dateTime: new Date(appointment.startAt).toISOString().split('.')[0],
                timeZone: 'America/Argentina/Buenos_Aires',
            },
            end: {
                dateTime: new Date(appointment.endAt).toISOString().split('.')[0],
                timeZone: 'America/Argentina/Buenos_Aires',
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 30 },
                    { method: 'email', minutes: 60 },
                ],
            },
        };

        // Add patient as attendee if they have an email
        if (patientEmail) {
            event.attendees = [{ email: patientEmail }];
        }

        // Generate Google Meet link for video_call appointments
        if (appointment.modality === 'video_call' && shouldCreateMeet) {
            event.conferenceData = {
                createRequest: {
                    requestId: `psicosaas-${appointment._id || Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            };
        }

        logger.debug('Creating Google Calendar event', { calendarId, appointmentId: appointment._id, event });

        try {
            const response = await calendar.events.insert({
                calendarId,
                requestBody: event,
                sendUpdates: 'all',
                conferenceDataVersion: appointment.modality === 'video_call' && shouldCreateMeet ? 1 : 0,
            });

            const googleEventId = response.data.id || null;
            const meetLink = response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

            // Persist the Google Event ID and optional Meet link back to the appointment
            if (googleEventId) {
                const updateFields: any = { googleEventId };
                if (meetLink) updateFields.meetingUrl = meetLink;
                await Appointment.findByIdAndUpdate(appointment._id, { $set: updateFields }).setOptions({ _skipTenantCheck: true } as any);
            }

            logger.info(`Google Calendar event created: ${googleEventId}`);
            return googleEventId;
        } catch (error: any) {
            logger.error('Failed to create Google Calendar event', { error: error?.response?.data || error.message || error });
            return null;
        }
    },

    /**
     * Update an existing Google Calendar event.
     */
    async updateEvent(
        professionalId: string | Types.ObjectId,
        googleEventId: string,
        updatedData: { startAt?: Date; endAt?: Date; patientName?: string; modality?: string }
    ): Promise<void> {
        const auth = await this.getAuthenticatedClient(professionalId);
        if (!auth) return;

        const calendar = google.calendar({ version: 'v3', auth });
        const user = await User.findById(professionalId).setOptions({ _skipTenantCheck: true } as any);
        const calendarId = user?.googleIntegration?.calendarId || 'primary';

        const patch: calendar_v3.Schema$Event = {};
        if (updatedData.startAt) {
            patch.start = { dateTime: updatedData.startAt.toISOString().split('.')[0], timeZone: 'America/Argentina/Buenos_Aires' };
        }
        if (updatedData.endAt) {
            patch.end = { dateTime: updatedData.endAt.toISOString().split('.')[0], timeZone: 'America/Argentina/Buenos_Aires' };
        }
        if (updatedData.patientName) {
            patch.summary = `Turno: ${updatedData.patientName}`;
        }

        try {
            await calendar.events.patch({
                calendarId,
                eventId: googleEventId,
                requestBody: patch,
                sendUpdates: 'all',
            });
            logger.info(`Google Calendar event updated: ${googleEventId}`);
        } catch (error) {
            logger.error('Failed to update Google Calendar event', { error });
        }
    },

    /**
     * Delete/cancel a Google Calendar event.
     */
    async deleteEvent(
        professionalId: string | Types.ObjectId,
        googleEventId: string
    ): Promise<void> {
        const auth = await this.getAuthenticatedClient(professionalId);
        if (!auth) return;

        const calendar = google.calendar({ version: 'v3', auth });
        const user = await User.findById(professionalId).setOptions({ _skipTenantCheck: true } as any);
        const calendarId = user?.googleIntegration?.calendarId || 'primary';

        try {
            await calendar.events.delete({
                calendarId,
                eventId: googleEventId,
                sendUpdates: 'all',
            });
            logger.info(`Google Calendar event deleted: ${googleEventId}`);
        } catch (error) {
            logger.error('Failed to delete Google Calendar event', { error });
        }
    },

    /**
     * Disconnect Google Calendar integration for a user.
     */
    async disconnect(userId: string | Types.ObjectId, tenantId: string): Promise<void> {
        await User.findOneAndUpdate(
            { _id: userId, tenantId },
            {
                $set: {
                    'googleIntegration.connected': false,
                    'googleIntegration.refreshToken': null,
                    'googleIntegration.accessToken': null,
                    'googleIntegration.email': null,
                    'googleIntegration.tokenExpiry': null,
                },
            }
        );
        logger.info(`Google Calendar disconnected for user ${userId}`);
    },
};
