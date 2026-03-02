import {
    AppError,
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    TenantSuspendedError,
} from '@shared/errors/AppError';

describe('AppError', () => {
    it('should create an error with correct properties', () => {
        const error = new AppError('Something went wrong', 500, 'INTERNAL');
        expect(error.message).toBe('Something went wrong');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL');
        expect(error.isOperational).toBe(true);
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(AppError);
    });

    it('should default code to INTERNAL_ERROR', () => {
        const error = new AppError('fail', 500);
        expect(error.code).toBe('INTERNAL_ERROR');
    });
});

describe('NotFoundError', () => {
    it('should have 404 status and NOT_FOUND code', () => {
        const error = new NotFoundError('Patient');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe('Patient not found');
    });

    it('should default resource to Resource', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
    });
});

describe('ValidationError', () => {
    it('should have 400 status and VALIDATION_ERROR code', () => {
        const error = new ValidationError('Bad input', [{ field: 'email' }]);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.errors).toEqual([{ field: 'email' }]);
    });

    it('should have defaults', () => {
        const error = new ValidationError();
        expect(error.message).toBe('Validation failed');
        expect(error.errors).toEqual([]);
    });
});

describe('UnauthorizedError', () => {
    it('should have 401 status', () => {
        const error = new UnauthorizedError('Bad token');
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Bad token');
    });
});

describe('ForbiddenError', () => {
    it('should have 403 status', () => {
        const error = new ForbiddenError();
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toBe('Insufficient permissions');
    });
});

describe('ConflictError', () => {
    it('should have 409 status', () => {
        const error = new ConflictError('Email taken');
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
        expect(error.message).toBe('Email taken');
    });
});

describe('TenantSuspendedError', () => {
    it('should have 403 status and TENANT_SUSPENDED code', () => {
        const error = new TenantSuspendedError();
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('TENANT_SUSPENDED');
    });
});
