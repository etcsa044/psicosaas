/**
 * Keyword Manager — classifies incoming messages by restriction level.
 * Prohibited: immediately rejected, never reach LLM.
 * Sensitive: flagged and modified before LLM.
 * Administrative: handled by task engine directly, no LLM needed.
 */
export type KeywordLevel = 'prohibited' | 'sensitive' | 'administrative';

export interface KeywordMatch {
    keyword: string;
    level: KeywordLevel;
    action: string;
}

const KEYWORD_RULES: Array<{ pattern: RegExp; level: KeywordLevel; action: string }> = [
    // Prohibited — NEVER process, escalate immediately
    { pattern: /suicid/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },
    { pattern: /autolesion/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },
    { pattern: /abuso\s*sexual/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },
    { pattern: /violencia\s*(doméstica|familiar|de\s*género)/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },
    { pattern: /quiero\s*morir/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },
    { pattern: /hacerme\s*daño/i, level: 'prohibited', action: 'ESCALATE_IMMEDIATELY' },

    // Sensitive — flag, don't send to LLM raw
    { pattern: /diagnóstico/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },
    { pattern: /medicación|medicamento/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },
    { pattern: /receta/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },
    { pattern: /historia\s*clínica/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },
    { pattern: /tratamiento/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },
    { pattern: /terapia/i, level: 'sensitive', action: 'REDIRECT_TO_PROFESSIONAL' },

    // Administrative — handled by task engine
    { pattern: /turno|cita|reserv/i, level: 'administrative', action: 'APPOINTMENT_TASK' },
    { pattern: /cancel/i, level: 'administrative', action: 'CANCEL_TASK' },
    { pattern: /reprogramar|cambiar.*turno/i, level: 'administrative', action: 'RESCHEDULE_TASK' },
    { pattern: /horario|disponib/i, level: 'administrative', action: 'AVAILABILITY_TASK' },
    { pattern: /deuda|saldo|pag/i, level: 'administrative', action: 'CHECK_DEBT_TASK' },
    { pattern: /precio|costo|arancel/i, level: 'administrative', action: 'PRICE_INFO_TASK' },
];

export class KeywordManager {
    /**
     * Analyze message for keyword matches. Returns first match found.
     * Order matters: prohibited > sensitive > administrative.
     */
    analyze(message: string): KeywordMatch | null {
        for (const rule of KEYWORD_RULES) {
            const match = message.match(rule.pattern);
            if (match) {
                return {
                    keyword: match[0],
                    level: rule.level,
                    action: rule.action,
                };
            }
        }
        return null;
    }

    isProhibited(message: string): boolean {
        const match = this.analyze(message);
        return match?.level === 'prohibited';
    }

    isSensitive(message: string): boolean {
        const match = this.analyze(message);
        return match?.level === 'sensitive';
    }
}

export const keywordManager = new KeywordManager();
