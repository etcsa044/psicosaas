export interface GovernanceResult {
    action: 'allowed' | 'blocked' | 'escalated' | 'modified';
    message: string;
    originalMessage?: string;
    reason?: string;
}

const PROHIBITED_RESPONSE_PATTERNS = [
    /diagnos/i, /prescri/i, /medicar/i, /medicamento/i,
    /trastorno/i, /depresión clínica/i, /ansiedad generalizada/i,
    /esquizo/i, /bipolar/i, /TDAH/i, /receta médica/i, /dosis/i,
];

const ESCALATION_MSG = '⚠️ Entiendo tu situación. Voy a comunicarme con el profesional para que pueda atenderte lo antes posible. Si estás en una emergencia, llamá al 135 (Centro de Asistencia al Suicida) o al 911.';
const REDIRECT_MSG = '🔒 Esa consulta requiere la atención directa del profesional. Le voy a avisar para que te contacte. ¿Hay algo administrativo en lo que pueda ayudarte?';

export class GovernanceGuard {
    preCheck(message: string, keywordLevel?: string): GovernanceResult {
        if (keywordLevel === 'prohibited') {
            return { action: 'escalated', message: ESCALATION_MSG, reason: 'Prohibited keyword detected' };
        }
        if (keywordLevel === 'sensitive') {
            return { action: 'modified', message: REDIRECT_MSG, reason: 'Sensitive clinical topic' };
        }
        return { action: 'allowed', message };
    }

    postCheck(botResponse: string): GovernanceResult {
        for (const pattern of PROHIBITED_RESPONSE_PATTERNS) {
            if (pattern.test(botResponse)) {
                return {
                    action: 'modified',
                    message: 'Esa consulta excede mis funciones como asistente administrativo. Te recomiendo hablar directamente con tu profesional.',
                    originalMessage: botResponse,
                    reason: `Response contained prohibited pattern: ${pattern.source}`,
                };
            }
        }
        return { action: 'allowed', message: botResponse };
    }

    buildSystemPrompt(botName: string, botTone: string, professionalName: string): string {
        const toneMap: Record<string, string> = {
            formal: 'Usá un tono formal y profesional.',
            calido: 'Usá un tono cálido y empático, pero siempre profesional.',
            neutro: 'Usá un tono neutro y eficiente.',
        };
        return `Sos ${botName}, un asistente administrativo virtual del consultorio de ${professionalName}.

REGLAS ESTRICTAS (NUNCA violar):
- NUNCA des consejos médicos, psicológicos o de salud mental.
- NUNCA menciones diagnósticos, medicamentos o tratamientos.
- NUNCA accedas ni menciones información clínica de ningún paciente.
- Si alguien menciona temas clínicos, redirigí al profesional.
- SIEMPRE identificáte como asistente ADMINISTRATIVO.

TUS FUNCIONES: turnos, saldos, recordatorios, derivar consultas al profesional.

${toneMap[botTone] || toneMap.neutro}
Respondé siempre en español. Sé breve y claro.`;
    }
}

export const governanceGuard = new GovernanceGuard();
