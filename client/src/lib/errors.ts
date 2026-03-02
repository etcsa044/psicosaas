import { AxiosError } from 'axios';

export interface ApiErrorResponse {
    status: 'error';
    code: string;
    message: string;
    errors?: Array<{ field: string; message: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: 'No encontrado',
    VALIDATION_ERROR: 'Los datos ingresados no son válidos',
    UNAUTHORIZED: 'Tu sesión expiró. Iniciá sesión nuevamente.',
    FORBIDDEN: 'No tenés permisos para realizar esta acción',
    CONFLICT: 'Ya existe un registro con estos datos',
    DUPLICATE_KEY: 'Ya existe un registro con estos datos',
    TENANT_SUSPENDED: 'Tu cuenta está suspendida. Actualizá tu suscripción.',
    INTERNAL_ERROR: 'Ocurrió un error inesperado. Intentá de nuevo.',
};

/**
 * Extract a user-friendly message from an API error.
 * Never exposes raw backend messages to users.
 */
export function getApiErrorMessage(error: unknown): string {
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiErrorResponse;
        return ERROR_MESSAGES[data.code] || ERROR_MESSAGES.INTERNAL_ERROR;
    }
    if (error instanceof Error) {
        return ERROR_MESSAGES.INTERNAL_ERROR;
    }
    return ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Extract field-level validation errors for forms.
 */
export function getFieldErrors(error: unknown): Record<string, string> | null {
    if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as ApiErrorResponse;
        if (data.code === 'VALIDATION_ERROR' && data.errors) {
            const fieldErrors: Record<string, string> = {};
            data.errors.forEach((e) => {
                fieldErrors[e.field] = e.message;
            });
            return fieldErrors;
        }
    }
    return null;
}
