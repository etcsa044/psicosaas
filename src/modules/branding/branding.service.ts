import Branding, { IBranding } from './models/branding.model';
import { NotFoundError } from '@shared/errors/AppError';

export class BrandingService {
    async createDefaultBranding(tenantId: string, nombrePublico?: string): Promise<IBranding> {
        return Branding.create({
            tenantId,
            nombrePublico: nombrePublico || '',
        });
    }

    async getBrandingByTenant(tenantId: string): Promise<IBranding> {
        const branding = await Branding.findOne({ tenantId }).lean() as IBranding | null;
        if (!branding) throw new NotFoundError('Branding');
        return branding;
    }

    async updateBranding(tenantId: string, updates: Partial<IBranding>): Promise<IBranding> {
        const branding = await Branding.findOneAndUpdate(
            { tenantId },
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        );
        if (!branding) throw new NotFoundError('Branding');
        return branding;
    }
}

export const brandingService = new BrandingService();
