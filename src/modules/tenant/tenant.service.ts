import Tenant, { ITenant, COUNTRY_DEFAULTS } from './models/tenant.model';
import { NotFoundError } from '@shared/errors/AppError';
import { Types } from 'mongoose';

export class TenantService {
    async createTenant(tenantId: string, ownerUserId: Types.ObjectId, countryCode: string = 'AR'): Promise<ITenant> {
        const defaults = COUNTRY_DEFAULTS[countryCode] || COUNTRY_DEFAULTS['AR'];
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

        return Tenant.create({
            tenantId,
            ownerUserId,
            status: 'trial',
            plan: 'free_trial',
            trialEndsAt,
            country: {
                code: countryCode,
                ...defaults,
            },
        });
    }

    async getTenantById(tenantId: string): Promise<ITenant> {
        const tenant = await Tenant.findOne({ tenantId }).lean() as ITenant | null;
        if (!tenant) throw new NotFoundError('Tenant');
        return tenant;
    }

    async updateTenant(tenantId: string, updates: Partial<ITenant>): Promise<ITenant> {
        const tenant = await Tenant.findOneAndUpdate(
            { tenantId },
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );
        if (!tenant) throw new NotFoundError('Tenant');
        return tenant;
    }

    async suspendTenant(tenantId: string, reason: string): Promise<ITenant> {
        return this.updateTenant(tenantId, { status: 'suspended' } as any);
    }

    async activateTenant(tenantId: string): Promise<ITenant> {
        return this.updateTenant(tenantId, { status: 'active' } as any);
    }
}

export const tenantService = new TenantService();
