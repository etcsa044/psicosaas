import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
    tenantId: string;
    ownerUserId: mongoose.Types.ObjectId;
    status: string;
    plan: string;
    trialEndsAt?: Date;
    country: {
        code: string;
        timezone: string;
        locale: string;
        currency: { code: string; symbol: string };
        dateFormat: string;
        taxRate: number;
        dataProtectionLaw: string;
        healthDataRegulation: string;
    };
    enabledBotTasks: string[];
    keywordRestrictionMode: string;
}

const COUNTRY_DEFAULTS: Record<string, any> = {
    AR: { timezone: 'America/Argentina/Buenos_Aires', locale: 'es-AR', currency: { code: 'ARS', symbol: '$' }, dateFormat: 'DD/MM/YYYY', taxRate: 21, dataProtectionLaw: 'Ley 25.326', healthDataRegulation: 'Ley 26.529' },
    CL: { timezone: 'America/Santiago', locale: 'es-CL', currency: { code: 'CLP', symbol: '$' }, dateFormat: 'DD/MM/YYYY', taxRate: 19, dataProtectionLaw: 'Ley 19.628', healthDataRegulation: 'Ley 20.584' },
    MX: { timezone: 'America/Mexico_City', locale: 'es-MX', currency: { code: 'MXN', symbol: '$' }, dateFormat: 'DD/MM/YYYY', taxRate: 16, dataProtectionLaw: 'LFPDPPP', healthDataRegulation: 'NOM-004-SSA3-2012' },
    CO: { timezone: 'America/Bogota', locale: 'es-CO', currency: { code: 'COP', symbol: '$' }, dateFormat: 'DD/MM/YYYY', taxRate: 19, dataProtectionLaw: 'Ley 1581', healthDataRegulation: 'Resolución 1995/1999' },
    ES: { timezone: 'Europe/Madrid', locale: 'es-ES', currency: { code: 'EUR', symbol: '€' }, dateFormat: 'DD/MM/YYYY', taxRate: 21, dataProtectionLaw: 'RGPD / LOPDGDD', healthDataRegulation: 'Ley 41/2002' },
    UY: { timezone: 'America/Montevideo', locale: 'es-UY', currency: { code: 'UYU', symbol: '$' }, dateFormat: 'DD/MM/YYYY', taxRate: 22, dataProtectionLaw: 'Ley 18.331', healthDataRegulation: 'Ley 18.335' },
};

export { COUNTRY_DEFAULTS };

const TenantSchema = new Schema<ITenant>(
    {
        tenantId: { type: String, required: true, unique: true },
        ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['active', 'suspended', 'cancelled', 'trial'],
            default: 'trial',
        },
        plan: {
            type: String,
            enum: ['free_trial', 'basic', 'professional', 'premium'],
            default: 'free_trial',
        },
        trialEndsAt: { type: Date },
        country: {
            code: { type: String, enum: ['AR', 'CL', 'MX', 'CO', 'ES', 'UY'], default: 'AR' },
            timezone: { type: String, default: 'America/Argentina/Buenos_Aires' },
            locale: { type: String, default: 'es-AR' },
            currency: {
                code: { type: String, default: 'ARS' },
                symbol: { type: String, default: '$' },
            },
            dateFormat: { type: String, default: 'DD/MM/YYYY' },
            taxRate: { type: Number, default: 21 },
            dataProtectionLaw: { type: String, default: 'Ley 25.326' },
            healthDataRegulation: { type: String, default: 'Ley 26.529' },
        },
        enabledBotTasks: {
            type: [String],
            default: [
                'CHECK_AVAILABILITY', 'CONFIRM_APPOINTMENT', 'CANCEL_APPOINTMENT',
                'RESCHEDULE_APPOINTMENT', 'CHECK_DEBT', 'SEND_PAYMENT_INFO',
                'SEND_REMINDER', 'ESCALATE_TO_PROFESSIONAL',
            ],
        },
        keywordRestrictionMode: {
            type: String,
            enum: ['basic', 'advanced'],
            default: 'basic',
        },
    },
    { timestamps: true }
);

TenantSchema.index({ status: 1 });
TenantSchema.index({ 'country.code': 1 });

export default mongoose.model<ITenant>('Tenant', TenantSchema);
