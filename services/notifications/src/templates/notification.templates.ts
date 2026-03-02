export interface NotificationTemplate {
    name: string;
    channel: string;
    subject?: string;
    body: string;
}

/**
 * Pre-defined notification templates.
 * Variables are denoted by {{variableName}}.
 */
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
    // Appointment reminders
    APPOINTMENT_REMINDER_24H: {
        name: 'appointment_reminder_24h',
        channel: 'whatsapp',
        body: '¡Hola {{patientName}}! Te recordamos que tenés turno mañana {{date}} a las {{time}} con {{professionalName}}. {{customMessage}}',
    },
    APPOINTMENT_REMINDER_2H: {
        name: 'appointment_reminder_2h',
        channel: 'whatsapp',
        body: '¡Hola {{patientName}}! Tu turno es en 2 horas ({{time}}). {{location}} {{customMessage}}',
    },
    APPOINTMENT_CONFIRMED: {
        name: 'appointment_confirmed',
        channel: 'whatsapp',
        body: '✅ Tu turno fue confirmado: {{date}} a las {{time}} con {{professionalName}}.',
    },
    APPOINTMENT_CANCELLED: {
        name: 'appointment_cancelled',
        channel: 'whatsapp',
        body: '❌ Tu turno del {{date}} a las {{time}} fue cancelado. Motivo: {{reason}}. Comunicate para reprogramar.',
    },
    APPOINTMENT_RESCHEDULED: {
        name: 'appointment_rescheduled',
        channel: 'whatsapp',
        body: '🔄 Tu turno fue reprogramado: nueva fecha {{newDate}} a las {{newTime}}.',
    },

    // Payment
    PAYMENT_RECEIVED: {
        name: 'payment_received',
        channel: 'whatsapp',
        body: '💰 Pago recibido: ${{amount}} ({{method}}). Gracias {{patientName}}.',
    },
    PAYMENT_REMINDER: {
        name: 'payment_reminder',
        channel: 'whatsapp',
        body: 'Hola {{patientName}}, tenés un saldo pendiente de ${{amount}}. Podés abonar por transferencia o en tu próxima sesión.',
    },

    // Consent
    CONSENT_REQUIRED: {
        name: 'consent_required',
        channel: 'email',
        subject: 'Consentimiento informado pendiente',
        body: 'Hola {{patientName}}, necesitamos que firmes el consentimiento informado: {{consentType}}. Accedé desde: {{link}}',
    },

    // Subscription
    SUBSCRIPTION_TRIAL_ENDING: {
        name: 'subscription_trial_ending',
        channel: 'email',
        subject: 'Tu período de prueba termina pronto',
        body: 'Tu período de prueba de PsicoSaaS finaliza el {{endDate}}. ¡Elegí un plan para seguir usando la plataforma!',
    },
    SUBSCRIPTION_PAYMENT_FAILED: {
        name: 'subscription_payment_failed',
        channel: 'email',
        subject: 'Problema con tu pago',
        body: 'No pudimos procesar tu pago de suscripción. Actualizá tu medio de pago para evitar la suspensión de tu cuenta.',
    },
};

export function renderTemplate(templateName: string, data: Record<string, string>): string {
    const template = NOTIFICATION_TEMPLATES[templateName];
    if (!template) return '';

    let rendered = template.body;
    for (const [key, value] of Object.entries(data)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
}
