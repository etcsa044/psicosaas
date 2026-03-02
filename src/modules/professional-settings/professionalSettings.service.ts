import ProfessionalSettings, { IProfessionalSettings } from './models/professionalSettings.model';
import { Types } from 'mongoose';
import { ValidationError } from '@shared/errors/AppError';

export class ProfessionalSettingsService {
    async getOrCreateSettings(tenantId: string, professionalId: Types.ObjectId): Promise<IProfessionalSettings> {
        let settings = await ProfessionalSettings.findOne({ tenantId, professionalId });

        if (!settings) {
            settings = await ProfessionalSettings.create({
                tenantId,
                professionalId,
                defaultRules: {
                    weeklyFrequencyPolicy: {
                        mode: 'alert',
                        maxPerWeek: 1
                    },
                    appointmentDurationMinutes: 45
                },
                patientTypeOverrides: {} // Empty Map
            });
        }

        return settings;
    }

    async updateSettings(tenantId: string, professionalId: Types.ObjectId, data: Partial<IProfessionalSettings>): Promise<IProfessionalSettings> {
        const settings = await this.getOrCreateSettings(tenantId, professionalId);

        if (data.defaultRules) {
            if (data.defaultRules.weeklyFrequencyPolicy) {
                const policy = data.defaultRules.weeklyFrequencyPolicy;
                if (policy.mode !== 'none' && (!policy.maxPerWeek || policy.maxPerWeek < 1)) {
                    throw new ValidationError('maxPerWeek is required and must be >= 1 when mode is not "none"');
                }
                settings.defaultRules.weeklyFrequencyPolicy = policy;
            }
            if (data.defaultRules.appointmentDurationMinutes) {
                settings.defaultRules.appointmentDurationMinutes = data.defaultRules.appointmentDurationMinutes;
            }
        }

        if (data.patientTypeOverrides) {
            settings.patientTypeOverrides = data.patientTypeOverrides as any;
        }

        await settings.save();
        return settings;
    }
}

export const professionalSettingsService = new ProfessionalSettingsService();
