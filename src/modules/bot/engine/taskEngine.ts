export interface TaskResult {
    taskName: string;
    success: boolean;
    response: string;
    data?: any;
}

export type TaskHandler = (tenantId: string, userPhone: string, message: string) => Promise<TaskResult>;

const taskHandlers: Record<string, TaskHandler> = {
    AVAILABILITY_TASK: async () => ({
        taskName: 'CHECK_AVAILABILITY', success: true,
        response: 'Para consultar disponibilidad, necesito saber qué día te gustaría. ¿Qué fecha te queda bien?',
    }),
    APPOINTMENT_TASK: async () => ({
        taskName: 'CONFIRM_APPOINTMENT', success: true,
        response: '¿Querés reservar un turno? Decime la fecha y horario que preferís y lo verifico.',
    }),
    CANCEL_TASK: async () => ({
        taskName: 'CANCEL_APPOINTMENT', success: true,
        response: '¿Querés cancelar tu próximo turno? Confirmame y lo cancelo.',
    }),
    RESCHEDULE_TASK: async () => ({
        taskName: 'RESCHEDULE_APPOINTMENT', success: true,
        response: 'Para reprogramar tu turno, necesito saber la nueva fecha y hora. ¿Cuándo te gustaría?',
    }),
    CHECK_DEBT_TASK: async () => ({
        taskName: 'CHECK_DEBT', success: true,
        response: 'Voy a consultar tu saldo. Un momento por favor...',
    }),
    PRICE_INFO_TASK: async () => ({
        taskName: 'PRICE_INFO', success: true,
        response: 'Para información sobre aranceles, por favor comunicáte directamente con el profesional.',
    }),
};

export class TaskEngine {
    async execute(taskAction: string, tenantId: string, userPhone: string, message: string): Promise<TaskResult> {
        const handler = taskHandlers[taskAction];
        if (!handler) {
            return { taskName: 'UNKNOWN', success: false, response: 'No pude entender tu consulta. ¿Podrías reformularla?' };
        }
        return handler(tenantId, userPhone, message);
    }
}

export const taskEngine = new TaskEngine();
