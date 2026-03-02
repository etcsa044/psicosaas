/**
 * Governance Guard — applies strict rules before and after LLM responses.
 * 
 * ABSOLUTE RULES:
 * 1. NEVER access clinical data (sessionNotes, diagnosis, medication)
 * 2. NEVER provide medical or psychological advice
 * 3. NEVER discuss suicide/self-harm — escalate immediately
 * 4. NEVER process prohibited keywords
 * 5. ALWAYS stay within predefined administrative tasks
 * 6. ALWAYS identify as an administrative assistant, NOT a professional
 */

export interface GovernanceResult {
    action: 'allowed' | 'blocked' | 'escalated' | 'modified';
    message: string;
    originalMessage?: string;
    reason?: string;
}

const PROHIBITED_RESPONSE_PATTERNS = [
    /diagnos/i, /prescri/i, /medicar/i, /medicamento/i,
    /trastorno/i, /depresión clínica/i, /ansiedad generalizada/i,
    /esquizo/i, /bipolar/i, /TDAH/i,
    /receta médica/i, /dosis/i,
];

const ESCALATION_MESSAGE = '⚠️ Entiendo tu situación. Voy a comunicarme con el profesional para que pueda atenderte lo antes posible. Si estás en una emergencia, llamá al 135 (Centro de Asistencia al Suicida) o al 911.';

const REDIRECT_MESSAGE = '🔒 Esa consulta requiere la atención directa del profesional. Le voy a avisar para que te contacte. ¿Hay algo administrativo en lo que pueda ayudarte?';

export class GovernanceGuard {
    /**
     * Pre-check: validate incoming message before processing.
     */
    preCheck(message: string, keywordLevel?: string): GovernanceResult {
        // Prohibited keywords — immediate escalation
        if (keywordLevel === 'prohibited') {
            return {
                action: 'escalated',
                message: ESCALATION_MESSAGE,
                reason: 'Prohibited keyword detected',
            };
        }

        // Sensitive keywords — redirect to professional
        if (keywordLevel === 'sensitive') {
            return {
                action: 'modified',
                message: REDIRECT_MESSAGE,
                reason: 'Sensitive clinical topic',
            };
        }

        return { action: 'allowed', message };
    }

    /**
     * Post-check: validate LLM response before sending to user.
     */
    postCheck(botResponse: string): GovernanceResult {
        // Check for prohibited patterns in bot's response
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

    /**
     * Build system prompt with governance rules embedded.
     */
    buildSystemPrompt(botName: string, botTone: string, professionalName: string): string {
        const toneDescription = {
            formal: 'Usá un tono formal y profesional.',
            calido: 'Usá un tono cálido y empático, pero siempre profesional.',
            neutro: 'Usá un tono neutro y eficiente.',
        }[botTone] || 'Usá un tono neutro y eficiente.';

        return `Sos ${botName}, un asistente administrativo virtual del consultorio de ${professionalName}.

REGLAS ESTRICTAS (NUNCA violar):
- NUNCA des consejos médicos, psicológicos o de salud mental.
- NUNCA menciones diagnósticos, medicamentos o tratamientos.
- NUNCA accedas ni menciones información clínica de ningún paciente.
- Si alguien menciona temas clínicos, redirigí al profesional.
- Si detectás una situación de riesgo (suicidio, autolesión, abuso), respondé con el mensaje de emergencia y derivá.
- SIEMPRE identificáte como asistente ADMINISTRATIVO, no como profesional de salud.

TUS FUNCIONES:
- Consultar disponibilidad de turnos.
- Confirmar, cancelar o reprogramar turnos.
- Informar sobre saldos pendientes.
- Enviar recordatorios.
- Derivar consultas al profesional cuando corresponda.

${toneDescription}

Respondé siempre en español. Sé breve y claro.`;
    }
}

export const governanceGuard = new GovernanceGuard();
