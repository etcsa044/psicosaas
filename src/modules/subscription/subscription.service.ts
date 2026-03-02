import Subscription, { ISubscription } from './models/subscription.model';
import Invoice from './models/invoice.model';
import Tenant from '@modules/tenant/models/tenant.model';
import { NotFoundError } from '@shared/errors/AppError';
import { logger } from '@config/logger';
import { v4 as uuidv4 } from 'uuid';

const PLAN_PRICING: Record<string, { amount: number; currency: string }> = {
    basic: { amount: 4999, currency: 'ARS' },
    professional: { amount: 9999, currency: 'ARS' },
    premium: { amount: 19999, currency: 'ARS' },
};

export class SubscriptionService {
    async createTrialSubscription(tenantId: string): Promise<ISubscription> {
        const now = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        return Subscription.create({
            tenantId,
            plan: 'free_trial',
            status: 'trialing',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            trialStart: now,
            trialEnd,
            paymentGateway: 'mercado_pago',
            pricing: { amount: 0, currency: 'ARS', interval: 'monthly' },
        });
    }

    async getByTenant(tenantId: string): Promise<ISubscription> {
        const sub = await Subscription.findOne({ tenantId }).lean() as ISubscription | null;
        if (!sub) throw new NotFoundError('Subscription');
        return sub;
    }

    async upgradePlan(tenantId: string, plan: string, externalSubscriptionId?: string): Promise<ISubscription> {
        const pricing = PLAN_PRICING[plan];
        if (!pricing) throw new NotFoundError('Plan');

        const now = new Date();
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const sub = await Subscription.findOneAndUpdate(
            { tenantId },
            {
                $set: {
                    plan,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    pricing: { ...pricing, interval: 'monthly' },
                    externalSubscriptionId,
                },
            },
            { returnDocument: 'after' }
        );
        if (!sub) throw new NotFoundError('Subscription');

        // Update tenant status
        await Tenant.findOneAndUpdate({ tenantId }, { status: 'active', plan });

        logger.info('Subscription upgraded', { tenantId, plan });
        return sub;
    }

    /**
     * Handle Mercado Pago webhook events — IDEMPOTENT
     */
    async handleWebhook(eventType: string, data: any): Promise<void> {
        logger.info('Mercado Pago webhook received', { eventType, dataId: data?.id });

        switch (eventType) {
            case 'payment':
                await this.handlePaymentEvent(data);
                break;
            case 'subscription_preapproval':
                await this.handleSubscriptionEvent(data);
                break;
            default:
                logger.warn('Unhandled webhook event', { eventType });
        }
    }

    private async handlePaymentEvent(data: any): Promise<void> {
        // In production: fetch payment details from Mercado Pago API using data.id
        // For now, handle based on data.status
        const externalPaymentId = data.id?.toString();
        if (!externalPaymentId) return;

        // Find subscription by external reference
        const sub = await Subscription.findOne({ externalSubscriptionId: data.external_reference });
        if (!sub) {
            logger.warn('Subscription not found for payment webhook', { externalRef: data.external_reference });
            return;
        }

        // Idempotency: check if already processed
        const alreadyProcessed = sub.paymentHistory.some((p) => p.externalPaymentId === externalPaymentId);
        if (alreadyProcessed) {
            logger.info('Payment already processed (idempotent)', { externalPaymentId });
            return;
        }

        if (data.status === 'approved') {
            sub.status = 'active';
            const now = new Date();
            sub.currentPeriodStart = now;
            sub.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            sub.paymentHistory.push({
                externalPaymentId,
                amount: data.transaction_amount || sub.pricing.amount,
                status: 'approved',
                paidAt: new Date(),
                gatewayResponse: JSON.stringify(data),
            });

            // Create invoice
            await Invoice.create({
                tenantId: sub.tenantId,
                subscriptionId: sub._id,
                invoiceNumber: `INV-${uuidv4().substring(0, 8).toUpperCase()}`,
                amount: data.transaction_amount || sub.pricing.amount,
                currency: sub.pricing.currency,
                status: 'paid',
                issuedAt: new Date(),
                dueDate: new Date(),
                paidAt: new Date(),
                externalPaymentId,
                description: `Suscripción ${sub.plan} — período ${sub.currentPeriodStart.toLocaleDateString()} a ${sub.currentPeriodEnd.toLocaleDateString()}`,
            });

            // Reactivate tenant if suspended
            await Tenant.findOneAndUpdate({ tenantId: sub.tenantId }, { status: 'active' });

            logger.info('Payment approved — subscription renewed', { tenantId: sub.tenantId });
        } else if (data.status === 'rejected') {
            sub.paymentHistory.push({
                externalPaymentId,
                amount: data.transaction_amount || 0,
                status: 'rejected',
                paidAt: new Date(),
                gatewayResponse: JSON.stringify(data),
            });
            sub.status = 'past_due';
            logger.warn('Payment rejected', { tenantId: sub.tenantId });
        }

        await sub.save();
    }

    private async handleSubscriptionEvent(data: any): Promise<void> {
        if (data.status === 'cancelled') {
            const sub = await Subscription.findOne({ externalSubscriptionId: data.id?.toString() });
            if (sub) {
                sub.status = 'cancelled';
                sub.cancelledAt = new Date();
                sub.cancellationReason = 'Cancelled via Mercado Pago';
                await sub.save();

                await Tenant.findOneAndUpdate({ tenantId: sub.tenantId }, { status: 'cancelled' });
                logger.info('Subscription cancelled via webhook', { tenantId: sub.tenantId });
            }
        }
    }

    async cancelSubscription(tenantId: string, reason?: string, immediate: boolean = false): Promise<ISubscription> {
        const sub = await Subscription.findOne({ tenantId });
        if (!sub) throw new NotFoundError('Subscription');

        if (immediate) {
            sub.status = 'cancelled';
            sub.cancelledAt = new Date();
        } else {
            sub.cancelAtPeriodEnd = true;
        }
        sub.cancellationReason = reason || 'Cancelled by user';

        await sub.save();
        logger.info('Subscription cancellation requested', { tenantId, immediate });
        return sub;
    }

    async getInvoices(tenantId: string): Promise<any[]> {
        return Invoice.find({ tenantId }).sort({ issuedAt: -1 }).lean();
    }
}

export const subscriptionService = new SubscriptionService();
