jest.mock('uuid', () => ({
    v4: () => 'mock-uuid-1234',
}));
jest.mock('@config/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@modules/subscription/models/subscription.model');
jest.mock('@modules/subscription/models/invoice.model');
jest.mock('@modules/tenant/models/tenant.model');

import { SubscriptionService } from '@modules/subscription/subscription.service';
import Subscription from '@modules/subscription/models/subscription.model';
import Tenant from '@modules/tenant/models/tenant.model';
import { NotFoundError } from '@shared/errors/AppError';

const service = new SubscriptionService();

describe('SubscriptionService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createTrialSubscription', () => {
        it('should create a trial subscription', async () => {
            const mockSub = { tenantId: 't1', plan: 'free_trial', status: 'trialing' };
            (Subscription.create as jest.Mock).mockResolvedValue(mockSub);

            const result = await service.createTrialSubscription('t1');
            expect(Subscription.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    tenantId: 't1',
                    plan: 'free_trial',
                    status: 'trialing',
                    pricing: expect.objectContaining({ amount: 0 }),
                })
            );
            expect(result).toEqual(mockSub);
        });
    });

    describe('getByTenant', () => {
        it('should return subscription when found', async () => {
            const mockSub = { tenantId: 't1', plan: 'basic' };
            (Subscription.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockSub),
            });

            const result = await service.getByTenant('t1');
            expect(result).toEqual(mockSub);
        });

        it('should throw NotFoundError when not found', async () => {
            (Subscription.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.getByTenant('nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('upgradePlan', () => {
        it('should upgrade to a valid plan', async () => {
            const upgraded = { tenantId: 't1', plan: 'professional', status: 'active' };
            (Subscription.findOneAndUpdate as jest.Mock).mockResolvedValue(upgraded);
            (Tenant.findOneAndUpdate as jest.Mock).mockResolvedValue({});

            const result = await service.upgradePlan('t1', 'professional');
            expect(result.plan).toBe('professional');
            expect(Tenant.findOneAndUpdate).toHaveBeenCalled();
        });

        it('should throw NotFoundError for invalid plan', async () => {
            await expect(service.upgradePlan('t1', 'nonexistent'))
                .rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError when subscription not found', async () => {
            (Subscription.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(service.upgradePlan('t1', 'basic'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel immediately', async () => {
            const mockSub = {
                tenantId: 't1',
                status: 'active',
                cancellationReason: null,
                cancelAtPeriodEnd: false,
                save: jest.fn().mockResolvedValue(true),
            } as any;
            (Subscription.findOne as jest.Mock).mockResolvedValue(mockSub);

            const result = await service.cancelSubscription('t1', 'No need', true);
            expect(result.status).toBe('cancelled');
            expect(result.cancelledAt).toBeInstanceOf(Date);
            expect(mockSub.save).toHaveBeenCalled();
        });

        it('should schedule cancellation at period end', async () => {
            const mockSub = {
                tenantId: 't1',
                status: 'active',
                cancelAtPeriodEnd: false,
                save: jest.fn().mockResolvedValue(true),
            } as any;
            (Subscription.findOne as jest.Mock).mockResolvedValue(mockSub);

            await service.cancelSubscription('t1', 'Trying another', false);
            expect(mockSub.cancelAtPeriodEnd).toBe(true);
            expect(mockSub.status).toBe('active'); // not cancelled yet
        });

        it('should throw NotFoundError when subscription not found', async () => {
            (Subscription.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.cancelSubscription('t1'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('getInvoices', () => {
        it('should return invoices sorted by date', async () => {
            const Invoice = require('@modules/subscription/models/invoice.model').default;
            const invoices = [{ invoiceNumber: 'INV-001' }];
            (Invoice.find as jest.Mock).mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(invoices),
                }),
            });

            const result = await service.getInvoices('t1');
            expect(result).toEqual(invoices);
        });
    });
});
