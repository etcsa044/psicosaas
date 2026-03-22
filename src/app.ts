import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { errorHandler } from '@shared/middleware/errorHandler.middleware';
import { logger } from '@config/logger';

// Route imports
import authRoutes from '@modules/auth/auth.routes';
import tenantRoutes from '@modules/tenant/tenant.routes';
import brandingRoutes from '@modules/branding/branding.routes';
import rbacRoutes from '@modules/rbac/rbac.routes';
import patientRoutes from '@modules/patient/patient.routes';
import consentRoutes from '@modules/consent/consent.routes';
import attachmentRoutes from '@modules/attachment/attachment.routes';
import clinicalRecordRoutes from '@modules/clinical-record/clinicalRecord.routes';
import appointmentRoutes from '@modules/appointment/appointment.routes';
import agendaRoutes from '@modules/agenda/agenda.routes';
import paymentRoutes from '@modules/payment/payment.routes';
import subscriptionRoutes from '@modules/subscription/subscription.routes';
import metricsRoutes from '@modules/metrics/metrics.routes';
import botWebhookRoutes from '@modules/bot/bot.routes';
import professionalSettingsRoutes from '@modules/professional-settings/professionalSettings.routes';
import feedbackRoutes from '@modules/feedback/feedback.routes';
import availabilityRoutes from '@modules/availability/availability.routes';

const app = express();

// ── Security ──
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3001', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(globalRateLimiter);

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logging ──
app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});

// ── Health check ──
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ── API Routes (Fase 1) ──
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/roles', rbacRoutes);

// ── API Routes (Fase 2) ──
app.use('/api/patients', patientRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/clinical-records', clinicalRecordRoutes);

// ── API Routes (Fase 3) ──
app.use('/api/appointments', appointmentRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);

// ── API Routes (Fase 4) ──
app.use('/api/metrics', metricsRoutes);
app.use('/api/bot', botWebhookRoutes);
app.use('/api/professional-settings', professionalSettingsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/availability', availabilityRoutes);

// ── 404 handler ──
app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
    });
});

// ── Global error handler ──
app.use(errorHandler);

export default app;
