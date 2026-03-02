/**
 * Test: API error handling
 * - Maps backend error codes to user-friendly messages
 * - Extracts field-level validation errors
 * - Never exposes raw backend messages
 */
import { AxiosError } from 'axios';
import { getApiErrorMessage, getFieldErrors } from '@/lib/errors';

function createAxiosError(code: string, message: string, status: number, errors?: any[]): AxiosError {
    const error = new AxiosError(message);
    error.response = {
        status,
        statusText: '',
        headers: {},
        config: {} as any,
        data: { status: 'error', code, message, errors },
    };
    return error;
}

describe('API Error Handling', () => {
    describe('getApiErrorMessage', () => {
        it('should map NOT_FOUND to Spanish message', () => {
            const error = createAxiosError('NOT_FOUND', 'Patient not found', 404);
            expect(getApiErrorMessage(error)).toBe('No encontrado');
        });

        it('should map UNAUTHORIZED to session expired message', () => {
            const error = createAxiosError('UNAUTHORIZED', 'Token expired', 401);
            expect(getApiErrorMessage(error)).toBe('Tu sesión expiró. Iniciá sesión nuevamente.');
        });

        it('should map FORBIDDEN to permission denied message', () => {
            const error = createAxiosError('FORBIDDEN', 'Missing permission', 403);
            expect(getApiErrorMessage(error)).toBe('No tenés permisos para realizar esta acción');
        });

        it('should map CONFLICT to duplicate message', () => {
            const error = createAxiosError('CONFLICT', 'Email exists', 409);
            expect(getApiErrorMessage(error)).toBe('Ya existe un registro con estos datos');
        });

        it('should map TENANT_SUSPENDED to suspension message', () => {
            const error = createAxiosError('TENANT_SUSPENDED', 'Tenant suspended', 403);
            expect(getApiErrorMessage(error)).toBe('Tu cuenta está suspendida. Actualizá tu suscripción.');
        });

        it('should return default message for unknown error codes', () => {
            const error = createAxiosError('UNKNOWN_CODE', 'Something bad', 500);
            expect(getApiErrorMessage(error)).toBe('Ocurrió un error inesperado. Intentá de nuevo.');
        });

        it('should return default message for non-axios errors', () => {
            expect(getApiErrorMessage(new Error('Random error'))).toBe('Ocurrió un error inesperado. Intentá de nuevo.');
        });

        it('should return default message for null/undefined', () => {
            expect(getApiErrorMessage(null)).toBe('Ocurrió un error inesperado. Intentá de nuevo.');
        });

        it('should NEVER return the raw backend message', () => {
            const error = createAxiosError('NOT_FOUND', 'Patient with id xyz not found in collection', 404);
            const msg = getApiErrorMessage(error);
            expect(msg).not.toContain('xyz');
            expect(msg).not.toContain('collection');
        });
    });

    describe('getFieldErrors', () => {
        it('should extract field-level errors for VALIDATION_ERROR', () => {
            const error = createAxiosError('VALIDATION_ERROR', 'Validation failed', 400, [
                { field: 'email', message: 'Invalid email format' },
                { field: 'firstName', message: 'Required' },
            ]);

            const fields = getFieldErrors(error);
            expect(fields).toEqual({
                email: 'Invalid email format',
                firstName: 'Required',
            });
        });

        it('should return null for non-validation errors', () => {
            const error = createAxiosError('NOT_FOUND', 'Not found', 404);
            expect(getFieldErrors(error)).toBeNull();
        });

        it('should return null for non-axios errors', () => {
            expect(getFieldErrors(new Error('Random'))).toBeNull();
        });
    });
});
