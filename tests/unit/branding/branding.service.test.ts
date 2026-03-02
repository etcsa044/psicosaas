jest.mock('@modules/branding/models/branding.model');

import { BrandingService } from '@modules/branding/branding.service';
import Branding from '@modules/branding/models/branding.model';
import { NotFoundError } from '@shared/errors/AppError';

const service = new BrandingService();

describe('BrandingService', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('createDefaultBranding', () => {
        it('should create default branding', async () => {
            const expected = { tenantId: 't1', nombrePublico: 'Mi Consultorio' };
            (Branding.create as jest.Mock).mockResolvedValue(expected);

            const result = await service.createDefaultBranding('t1', 'Mi Consultorio');
            expect(Branding.create).toHaveBeenCalledWith({
                tenantId: 't1',
                nombrePublico: 'Mi Consultorio',
            });
            expect(result).toEqual(expected);
        });

        it('should default to empty string for nombrePublico', async () => {
            (Branding.create as jest.Mock).mockResolvedValue({});

            await service.createDefaultBranding('t1');
            expect(Branding.create).toHaveBeenCalledWith({
                tenantId: 't1',
                nombrePublico: '',
            });
        });
    });

    describe('getBrandingByTenant', () => {
        it('should return branding when found', async () => {
            const mockBranding = { tenantId: 't1', nombrePublico: 'Test' };
            (Branding.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockBranding),
            });

            const result = await service.getBrandingByTenant('t1');
            expect(result).toEqual(mockBranding);
        });

        it('should throw NotFoundError when not found', async () => {
            (Branding.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            });

            await expect(service.getBrandingByTenant('nope'))
                .rejects.toThrow(NotFoundError);
        });
    });

    describe('updateBranding', () => {
        it('should update and return branding', async () => {
            const updated = { tenantId: 't1', nombrePublico: 'Updated' };
            (Branding.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await service.updateBranding('t1', { nombrePublico: 'Updated' } as any);
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundError when not found', async () => {
            (Branding.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(service.updateBranding('t1', {} as any))
                .rejects.toThrow(NotFoundError);
        });
    });
});
