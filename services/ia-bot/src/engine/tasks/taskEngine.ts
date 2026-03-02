/**
 * Task Engine — handles predefined administrative tasks.
 * Each task has a handler that returns a structured response.
 * Tasks are mapped to keyword actions from KeywordManager.
 */

export interface TaskResult {
    taskName: string;
    success: boolean;
    response: string;
    data?: any;
}

export type TaskHandler = (tenantId: string, userPhone: string, message: string) => Promise<TaskResult>;

const taskHandlers: Record<string, TaskHandler> = {
    AVAILABILITY_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'CHECK_AVAILABILITY',
        success: true,
        response: 'Para consultar disponibilidad, necesito saber qué día te gustaría. ¿Qué fecha te queda bien?',
        data: { requiresFollowUp: true, nextStep: 'ask_date' },
    }),

    APPOINTMENT_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'CONFIRM_APPOINTMENT',
        success: true,
        response: '¿Querés reservar un turno? Decime la fecha y horario que preferís y lo verifico.',
        data: { requiresFollowUp: true, nextStep: 'ask_appointment_details' },
    }),

    CANCEL_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'CANCEL_APPOINTMENT',
        success: true,
        response: '¿Querés cancelar tu próximo turno? Confirmame y lo cancelo.',
        data: { requiresFollowUp: true, nextStep: 'confirm_cancellation' },
    }),

    RESCHEDULE_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'RESCHEDULE_APPOINTMENT',
        success: true,
        response: 'Para reprogramar tu turno, necesito saber la nueva fecha y hora. ¿Cuándo te gustaría?',
        data: { requiresFollowUp: true, nextStep: 'ask_new_date' },
    }),

    CHECK_DEBT_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'CHECK_DEBT',
        success: true,
        response: 'Voy a consultar tu saldo. Un momento por favor...',
        data: { requiresFollowUp: false },
    }),

    PRICE_INFO_TASK: async (tenantId, _userPhone, _message) => ({
        taskName: 'PRICE_INFO',
        success: true,
        response: 'Para información sobre aranceles, por favor comunicáte directamente con el profesional.',
        data: { requiresFollowUp: false },
    }),
};

export class TaskEngine {
    async execute(taskAction: string, tenantId: string, userPhone: string, message: string): Promise<TaskResult> {
        const handler = taskHandlers[taskAction];
        if (!handler) {
            return {
                taskName: 'UNKNOWN',
                success: false,
                response: 'No pude entender tu consulta. ¿Podrías reformularla?',
            };
        }
        return handler(tenantId, userPhone, message);
    }

    getAvailableTasks(): string[] {
        return Object.keys(taskHandlers);
    }
}

export const taskEngine = new TaskEngine();
