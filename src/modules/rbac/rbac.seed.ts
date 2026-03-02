import Permission from './models/permission.model';
import { logger } from '@config/logger';

export const PERMISSIONS = [
    // Clinical
    { code: 'VIEW_CLINICAL_RECORD', category: 'clinical', description: 'Ver historia clínica' },
    { code: 'CREATE_CLINICAL_ENTRY', category: 'clinical', description: 'Crear entrada clínica' },
    { code: 'EXPORT_CLINICAL_RECORD', category: 'clinical', description: 'Exportar historia clínica completa' },
    { code: 'VIEW_PRIVATE_NOTES', category: 'clinical', description: 'Ver notas privadas (solo autor)' },

    // Patient
    { code: 'VIEW_PATIENT', category: 'patient', description: 'Ver datos de paciente' },
    { code: 'CREATE_PATIENT', category: 'patient', description: 'Crear paciente' },
    { code: 'EDIT_PATIENT', category: 'patient', description: 'Editar datos de paciente' },
    { code: 'DELETE_PATIENT', category: 'patient', description: 'Eliminar paciente (soft delete)' },
    { code: 'MANAGE_CONSENTS', category: 'patient', description: 'Gestionar consentimientos informados' },

    // Appointment
    { code: 'VIEW_APPOINTMENT', category: 'appointment', description: 'Ver turnos' },
    { code: 'CREATE_APPOINTMENT', category: 'appointment', description: 'Crear turno' },
    { code: 'EDIT_APPOINTMENT', category: 'appointment', description: 'Modificar turno' },
    { code: 'CANCEL_APPOINTMENT', category: 'appointment', description: 'Cancelar turno' },
    { code: 'VIEW_SCHEDULE', category: 'appointment', description: 'Ver agenda/horarios' },
    { code: 'EDIT_SCHEDULE', category: 'appointment', description: 'Modificar horarios' },

    // Financial
    { code: 'VIEW_FINANCIALS', category: 'financial', description: 'Ver pagos y deuda' },
    { code: 'CREATE_PAYMENT', category: 'financial', description: 'Registrar pago' },
    { code: 'EDIT_PAYMENT', category: 'financial', description: 'Modificar pago' },
    { code: 'VIEW_INVOICES', category: 'financial', description: 'Ver facturas' },
    { code: 'EXPORT_FINANCIALS', category: 'financial', description: 'Exportar reportes financieros' },

    // Admin
    { code: 'MANAGE_BRANDING', category: 'admin', description: 'Configurar marca/branding' },
    { code: 'MANAGE_ROLES', category: 'admin', description: 'Crear/editar roles' },
    { code: 'MANAGE_USERS', category: 'admin', description: 'Invitar/desactivar usuarios' },
    { code: 'MANAGE_SUBSCRIPTION', category: 'admin', description: 'Gestionar suscripción' },
    { code: 'VIEW_AUDIT_LOG', category: 'admin', description: 'Ver logs de auditoría' },
    { code: 'MANAGE_BOT_CONFIG', category: 'admin', description: 'Configurar bot IA' },

    // Bot (internal)
    { code: 'BOT_CHECK_AVAILABILITY', category: 'bot', description: 'Consultar disponibilidad (bot)' },
    { code: 'BOT_MANAGE_APPOINTMENT', category: 'bot', description: 'Gestionar turnos (bot)' },
    { code: 'BOT_CHECK_DEBT', category: 'bot', description: 'Consultar saldo (bot)' },
    { code: 'BOT_SEND_NOTIFICATION', category: 'bot', description: 'Enviar recordatorio (bot)' },
    { code: 'BOT_ESCALATE', category: 'bot', description: 'Derivar al profesional (bot)' },

    // Reports
    { code: 'VIEW_TENANT_METRICS', category: 'reports', description: 'Ver métricas del consultorio' },
    { code: 'EXPORT_REPORTS', category: 'reports', description: 'Exportar reportes' },
];

// System role templates (created per tenant on registration)
export const SYSTEM_ROLES = {
    OWNER: {
        name: 'OWNER',
        description: 'Propietario del consultorio — acceso total',
        isSystem: true,
        permissions: PERMISSIONS.map((p) => p.code), // All permissions
    },
    SUPERVISOR_CLINICO: {
        name: 'SUPERVISOR_CLINICO',
        description: 'Supervisor clínico — acceso clínico y pacientes',
        isSystem: false,
        permissions: [
            'VIEW_CLINICAL_RECORD', 'CREATE_CLINICAL_ENTRY', 'EXPORT_CLINICAL_RECORD',
            'VIEW_PATIENT', 'CREATE_PATIENT', 'EDIT_PATIENT', 'MANAGE_CONSENTS',
            'VIEW_APPOINTMENT', 'CREATE_APPOINTMENT', 'EDIT_APPOINTMENT', 'CANCEL_APPOINTMENT',
            'VIEW_SCHEDULE', 'EDIT_SCHEDULE',
            'VIEW_TENANT_METRICS',
        ],
    },
    ASSISTANT: {
        name: 'ASSISTANT',
        description: 'Asistente — pacientes y turnos',
        isSystem: false,
        permissions: [
            'VIEW_PATIENT', 'CREATE_PATIENT', 'EDIT_PATIENT',
            'VIEW_APPOINTMENT', 'CREATE_APPOINTMENT', 'EDIT_APPOINTMENT', 'CANCEL_APPOINTMENT',
            'VIEW_SCHEDULE',
        ],
    },
    RECEPCIONISTA: {
        name: 'RECEPCIONISTA',
        description: 'Recepcionista — turnos y datos básicos de pacientes',
        isSystem: false,
        permissions: [
            'VIEW_PATIENT', 'CREATE_PATIENT',
            'VIEW_APPOINTMENT', 'CREATE_APPOINTMENT', 'CANCEL_APPOINTMENT',
            'VIEW_SCHEDULE',
        ],
    },
    CONTADOR: {
        name: 'CONTADOR',
        description: 'Contador — solo acceso financiero',
        isSystem: false,
        permissions: [
            'VIEW_FINANCIALS', 'CREATE_PAYMENT', 'EDIT_PAYMENT',
            'VIEW_INVOICES', 'EXPORT_FINANCIALS',
            'VIEW_TENANT_METRICS',
        ],
    },
    IA_BOT_INTERNAL: {
        name: 'IA_BOT_INTERNAL',
        description: 'Rol interno del bot IA — permisos mínimos administrativos',
        isSystem: true,
        permissions: [
            'BOT_CHECK_AVAILABILITY', 'BOT_MANAGE_APPOINTMENT',
            'BOT_CHECK_DEBT', 'BOT_SEND_NOTIFICATION', 'BOT_ESCALATE',
            'VIEW_APPOINTMENT', 'VIEW_FINANCIALS',
        ],
    },
};

/**
 * Seed all permissions into the database.
 * This runs once at startup — idempotent via upsert.
 */
export async function seedPermissions(): Promise<void> {
    for (const perm of PERMISSIONS) {
        await Permission.findOneAndUpdate(
            { code: perm.code },
            perm,
            { upsert: true, returnDocument: 'after' }
        );
    }
    logger.info(`✅ Seeded ${PERMISSIONS.length} permissions`);
}
